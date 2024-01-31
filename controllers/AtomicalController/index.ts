import { Atomicals, ElectrumApi, createKeyPair } from 'atomicals'
import type { CommandResultInterface } from 'atomicals/commands/command-result.interface'
import { getKeypairInfo } from 'atomicals/utils/address-keypair-path'
import {
  AtomicalOperationBuilder,
  OUTPUT_BYTES_BASE,
  DUST_AMOUNT,
} from 'atomicals/utils/atomical-operation-builder'
import {
  AtomicalsPayload,
  prepareCommitRevealConfig,
} from 'atomicals/commands/command-helpers'
import { witnessStackToScriptWitness } from 'atomicals/commands/witness_stack_to_script_witness'
import bitcoin, { Psbt } from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as curve from 'tiny-secp256k1'
import { randomUUID } from 'crypto'

import { Order } from 'database'
import { utxoListener } from 'tasks'
import { Controller, Get, Payload, Post } from 'helpers/route'
import { Http400, Http500 } from 'helpers/http'
import { NETWORK, ORDER_EXPIRATION, OrderStatus, OrderType } from 'helpers/constants'
import { sendNotification } from 'helpers/notification'
import { mine } from 'helpers/miner'

import InitDFTPayload from './InitDFTPayload'

bitcoin.initEccLib(curve)
const ECPair = ECPairFactory(curve)

const electrum = ElectrumApi.createClient(process.env.ELECTRUMX_PROXY_BASE_URL)
export const atomicals = new Atomicals(electrum)

function resolveData(result: CommandResultInterface) {
  if (!result.success) {
    throw new Http500(100000, result.message)
  }
  return result.data
}

@Controller('/atomicals')
class AtomicalController {
  @Post('/init-dft')
  @Payload(InitDFTPayload)
  async initDft(payload: InitDFTPayload) {
    const atomPayload = {
      name: payload.name.toUpperCase(),
      desc: payload.description,
      legal: { terms: payload.legalTerms },
      args: {
        time: Math.floor(Date.now() / 1000),
        nonce: 0,
        bitworkc: '0000',
        max_mints: payload.maxMints,
        mint_amount: payload.mintAmount,
        mint_height: payload.mintHeight,
        mint_bitworkc: payload.bitworkc,
        request_ticker: payload.name.toLowerCase(),
      },
    }

    const keyPair = await createKeyPair()
    const keyPairRaw = ECPair.fromWIF(keyPair.WIF)
    const keyPairInfo = getKeypairInfo(keyPairRaw)

    // Calculate fees
    const mockBaseCommitForFeeCalculation = prepareCommitRevealConfig(
      'dft',
      keyPairInfo,
      new AtomicalsPayload(atomPayload),
      false
    )
    const builder = new AtomicalOperationBuilder({
      electrumApi: electrum,
      address: payload.address,
      opType: 'dft',
      dftOptions: {
        mintAmount: payload.mintAmount,
        maxMints: payload.maxMints,
        mintHeight: payload.mintHeight,
        ticker: payload.name,
      },
      satsbyte: payload.satsbyte,
    })
    builder.addOutput({
      address: payload.address,
      value: 546,
    })
    const fees = builder.calculateFeesRequiredForAccumulatedCommitAndReveal(
      mockBaseCommitForFeeCalculation.hashLockP2TR.redeem.output.length,
      false
    )

    const orderId = randomUUID()

    const order = new Order()
    order.id = orderId
    order.type = OrderType.InitDFT
    order.status = OrderStatus.Pending
    order.sessionId = ''
    order.receiveAddress = payload.address
    order.keyPair = keyPair
    order.metadata = { atomPayload, fees, satsbyte: payload.satsbyte }
    order.expiredAt = new Date(Date.now() + ORDER_EXPIRATION)
    await order.save()

    utxoListener.send({
      channel: 'init-dft',
      orderId,
      payAddress: keyPair.address,
      utxoValue: fees.commitAndRevealFeePlusOutputs
    })

    return {
      orderId,
      payAddress: keyPair.address,
      status: 'pending',
      fees,
    }
  }

  static async finishInitDft(orderId: string, utxo: any) {
    const order = await Order.findOneBy({ id: orderId })
    const { keyPair, receiveAddress, metadata } = order
    const { atomPayload, fees, satsbyte } = metadata

    const keyPairInfo = getKeypairInfo(ECPair.fromWIF(keyPair.WIF))
    const updatedBaseCommit = prepareCommitRevealConfig(
      'dft',
      keyPairInfo,
      new AtomicalsPayload(atomPayload),
      false
    )

    // Mining
    const mineResult = mine(
      JSON.stringify({
        privateKey: keyPair.privateKey,
        utxoTxid: utxo.txid,
        utxoVout: utxo.vout,
        utxoValue: utxo.value,
        // @ts-ignore
        utxoScriptPubkey: keyPairInfo.output.toString('hex'),
        outputValue: fees.revealFeePlusOutputs,
        outputScriptPubkey: updatedBaseCommit.scriptP2TR.output.toString('hex'),
        bitworkc: '0000',
        seqStart: 0,
        seqEnd: bitcoin.Transaction.DEFAULT_SEQUENCE,
      })
    )
    const { sequence } = JSON.parse(mineResult)

    let commitTxid: string
    let hashLockP2TR: bitcoin.payments.Payment

    ////////////////////////////////////////////////////////////////////////
    // Begin Commit Transaction
    ////////////////////////////////////////////////////////////////////////
    {
      // Create PSBT
      const psbt = new Psbt({
        network: NETWORK,
      })
      psbt.setVersion(1)
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.index,
        sequence: sequence,
        tapInternalKey: Buffer.from(keyPairInfo.childNodeXOnlyPubkey),
        witnessUtxo: {
          value: utxo.value,
          script: Buffer.from(keyPairInfo.output, 'hex'),
        },
      })
      psbt.addOutput({
        address: updatedBaseCommit.scriptP2TR.address,
        value: fees.revealFeePlusOutputs,
      })

      // Calculate change
      const calculatedFee = utxo.value - fees.revealFeePlusOutputs
      // It will be invalid, but at least we know we don't need to add change
      if (calculatedFee > 0) {
        // In order to keep the fee-rate unchanged, we should add extra fee for the new added change output.
        const expectedFee = fees.commitFeeOnly + satsbyte * OUTPUT_BYTES_BASE
        const differenceBetweenCalculatedAndExpected =
          calculatedFee - expectedFee
        // There were some excess satoshis, but let's verify that it meets the dust threshold to make change
        if (differenceBetweenCalculatedAndExpected >= DUST_AMOUNT) {
          psbt.addOutput({
            address: receiveAddress,
            value: differenceBetweenCalculatedAndExpected,
          })
        }
      }

      // Finalize
      psbt.signInput(0, keyPairInfo.tweakedChildNode)
      psbt.finalizeAllInputs()
      const tx = psbt.extractTransaction()
      const rawtx = tx.toHex()
      AtomicalOperationBuilder.finalSafetyCheckForExcessiveFee(psbt, tx)

      // Broadcast
      const result = await atomicals.broadcast(rawtx)
      if (!result.success) {
        sendNotification(
          'Finish init-dft error',
          `${orderId}: broadcast commit tx failed`
        )
        return
      }
      commitTxid = result.data
      hashLockP2TR = updatedBaseCommit.hashLockP2TR
    }

    ////////////////////////////////////////////////////////////////////////
    // Begin Reveal Transaction
    ////////////////////////////////////////////////////////////////////////
    {
      const tapLeafScript = {
        leafVersion: hashLockP2TR.redeem.redeemVersion,
        script: hashLockP2TR.redeem.output,
        controlBlock: hashLockP2TR.witness[hashLockP2TR.witness.length - 1],
      }

      let psbt = new Psbt({ network: NETWORK })
      psbt.setVersion(1)
      psbt.addInput({
        hash: commitTxid,
        index: 0,
        witnessUtxo: {
          value: fees.revealFeePlusOutputs,
          script: hashLockP2TR.output,
        },
        tapLeafScript: [tapLeafScript],
      })
      psbt.addOutput({
        address: receiveAddress,
        value: 546,
      })
      psbt.signInput(0, keyPairInfo.childNode)

      // We have to construct our witness script in a custom finalizer
      const customFinalizer = (_inputIndex: number, input: any) => {
        const scriptSolution = [input.tapScriptSig[0].signature]
        const witness = scriptSolution
          .concat(tapLeafScript.script)
          .concat(tapLeafScript.controlBlock)
        return {
          finalScriptWitness: witnessStackToScriptWitness(witness),
        }
      }
      psbt.finalizeInput(0, customFinalizer)

      const tx = psbt.extractTransaction()
      AtomicalOperationBuilder.finalSafetyCheckForExcessiveFee(psbt, tx)
      const result = await atomicals.broadcast(tx.toHex())
      if (!result.success) {
        sendNotification(
          'Finish init-dft error',
          `${orderId}: broadcast reveal tx failed`
        )
        return
      }

      metadata.commitTxid = commitTxid
      metadata.revealTxid = result.data
      order.status = OrderStatus.Completed
      await order.save()

      sendNotification('New Dft', `${atomPayload.name}`)
      console.log(`New Dft: ${result.data}`)
    }
  }

  @Get('/get-ticker')
  async getTicker(ctx: Ctx) {
    const ticker = ctx.query['ticker']
    if (!ticker) {
      throw new Http400(400, 'ticker is required')
    }
    const result = await atomicals.getAtomicalByTicker(
      (ticker as string).toLowerCase()
    )
    if (!result.success) {
      return { result: null }
    }
    return resolveData(result)
  }
}

export default AtomicalController
