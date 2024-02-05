import { Atomicals, ElectrumApi, createKeyPair } from 'atomicals'
import type { CommandResultInterface } from 'atomicals/commands/command-result.interface'
import { getKeypairInfo } from 'atomicals/utils/address-keypair-path'
import type { KeyPairInfo } from 'atomicals/utils/address-keypair-path'
import {
  AtomicalOperationBuilder,
  OUTPUT_BYTES_BASE,
  DUST_AMOUNT,
} from 'atomicals/utils/atomical-operation-builder'
import type { AtomicalOperationBuilderOptions } from 'atomicals/utils/atomical-operation-builder'
import type { KeyPair } from 'atomicals/lib/utils/create-key-pair'
import {
  AtomicalsPayload,
  prepareCommitRevealConfig,
} from 'atomicals/commands/command-helpers'
import { witnessStackToScriptWitness } from 'atomicals/commands/witness_stack_to_script_witness'
import bitcoin, { Psbt } from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as curve from 'tiny-secp256k1'
import { randomUUID } from 'crypto'

import { Order, Token, cache } from 'database'
import { Controller, Get, Payload, Post } from 'helpers/route'
import { Http400, Http404, Http500 } from 'helpers/http'
import {
  NETWORK,
  ORDER_EXPIRATION,
  OrderStatus,
  OrderType,
} from 'helpers/constants'
import { sendNotification } from 'helpers/notification'
import { mine } from 'helpers/miner'

import InitDFTPayload from './InitDFTPayload'
import MintFTPayload from './MintFTPayload'
import MintDFTPayload from './MintDFTPayload'
import MintNFTPayload from './MintNFTPayload'

bitcoin.initEccLib(curve)
const ECPair = ECPairFactory(curve)

const electrum = ElectrumApi.createClient(process.env.ELECTRUMX_PROXY_BASE_URL)

export const atomicals = new Atomicals(electrum)

type OpType = 'dft' | 'ft' | 'dmt' | 'nft'

function resolveData(result: CommandResultInterface) {
  if (!result.success) {
    throw new Http500(100000, result.message)
  }
  return result.data
}

@Controller('/atomicals')
class AtomicalController {
  private async createKeyPair() {
    const keyPair = await createKeyPair()
    const keyPairRaw = ECPair.fromWIF(keyPair.WIF)
    const keyPairInfo = getKeypairInfo(keyPairRaw)
    return { keyPair, keyPairInfo }
  }

  // Calculate fees
  private calcFees(
    params: {
      opType: OpType
      keyPairInfo: KeyPairInfo
      atomPayload: Dict
      receiveAddress: string
      satsbyte: number
    } & Pick<
      AtomicalOperationBuilderOptions,
      'dftOptions' | 'ftOptions' | 'dmtOptions' | 'nftOptions'
    >
  ) {
    const { opType } = params

    const config = prepareCommitRevealConfig(
      opType,
      params.keyPairInfo,
      new AtomicalsPayload(params.atomPayload),
      false
    )
    const builder = new AtomicalOperationBuilder({
      electrumApi: electrum,
      address: params.receiveAddress,
      opType: opType,
      dftOptions: params.dftOptions,
      ftOptions: params.ftOptions,
      dmtOptions: params.dmtOptions,
      nftOptions: params.nftOptions,
      satsbyte: params.satsbyte,
    })

    let utxoValue = 546
    if (opType === 'ft') {
      utxoValue = params.ftOptions.fixedSupply
    } else if (opType === 'dmt') {
      utxoValue = params.dmtOptions.mintAmount
    }

    builder.addOutput({
      address: params.receiveAddress,
      value: utxoValue,
    })
    const fees = builder.calculateFeesRequiredForAccumulatedCommitAndReveal(
      config.hashLockP2TR.redeem.output.length,
      false
    )

    return fees
  }

  async createOrder(
    ctx: Ctx,
    type: OrderType,
    receiveAddress: string,
    keyPair: KeyPair,
    metadata: Dict
  ) {
    const orderId = randomUUID()

    const order = new Order()
    order.id = orderId
    ;(order.type = type), (order.status = OrderStatus.Pending)
    order.sessionId = ctx.get('X-Session-Id')
    order.receiveAddress = receiveAddress
    order.keyPair = keyPair
    order.metadata = metadata
    order.expiredAt = new Date(Date.now() + ORDER_EXPIRATION)
    await order.save()

    return orderId
  }

  @Post('/init-dft')
  @Payload(InitDFTPayload)
  async initDFT(payload: InitDFTPayload, ctx: Ctx) {
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

    const { keyPair, keyPairInfo } = await this.createKeyPair()

    const fees = this.calcFees({
      opType: 'dft',
      keyPairInfo,
      atomPayload,
      receiveAddress: payload.address,
      satsbyte: payload.satsbyte,
      dftOptions: {
        mintAmount: payload.mintAmount,
        maxMints: payload.maxMints,
        mintHeight: payload.mintHeight,
        ticker: payload.name,
      },
    })

    const orderId = await this.createOrder(
      ctx,
      OrderType.InitDFT,
      payload.address,
      keyPair,
      {
        atomPayload,
        fees,
        satsbyte: payload.satsbyte,
      }
    )

    await cache.hset('payments', {
      [orderId]: JSON.stringify({
        address: keyPair.address,
        amount: fees.commitAndRevealFeePlusOutputs,
        opType: 'dft',
        expiredAt: Date.now() + ORDER_EXPIRATION,
      }),
    })

    return {
      orderId,
      payAddress: keyPair.address,
      status: OrderStatus.Pending,
      fees,
    }
  }

  @Post('/mint-ft')
  @Payload(MintFTPayload)
  async mintFT(payload: MintFTPayload, ctx: Ctx) {
    const atomPayload = {
      name: payload.name.toUpperCase(),
      desc: payload.description,
      legal: { terms: payload.legalTerms },
      args: {
        time: Math.floor(Date.now() / 1000),
        nonce: 0,
        bitworkc: '0000',
        request_ticker: payload.name.toLowerCase(),
      },
    }

    const { keyPair, keyPairInfo } = await this.createKeyPair()

    const fees = this.calcFees({
      opType: 'ft',
      keyPairInfo,
      atomPayload,
      receiveAddress: payload.address,
      satsbyte: payload.satsbyte,
      ftOptions: {
        ticker: payload.name,
        fixedSupply: payload.totalSupply,
      },
    })

    const orderId = await this.createOrder(
      ctx,
      OrderType.MintFT,
      payload.address,
      keyPair,
      {
        atomPayload,
        fees,
        satsbyte: payload.satsbyte,
        fixedSupply: payload.totalSupply,
      }
    )

    await cache.hset('payments', {
      [orderId]: JSON.stringify({
        address: keyPair.address,
        amount: fees.commitAndRevealFeePlusOutputs,
        opType: 'ft',
        expiredAt: Date.now() + ORDER_EXPIRATION,
      }),
    })

    return {
      orderId,
      payAddress: keyPair.address,
      status: OrderStatus.Pending,
      fees,
    }
  }

  @Post('/mint-dft')
  @Payload(MintDFTPayload)
  async mintDFT(payload: MintDFTPayload, ctx: Ctx) {
    const token = await Token.findOneBy({ name: payload.name })
    if (!token) {
      throw new Http404(`Token ${payload.name} not found`)
    }
    if (token.bitworkc === '') {
      throw new Http400(400, 'This token can not be minted')
    }

    const atomPayload = {
      args: {
        time: Math.floor(Date.now() / 1000),
        nonce: 0,
        bitworkc: token.bitworkc,
        mint_ticker: payload.name.toLowerCase(),
      },
    }

    const { keyPair, keyPairInfo } = await this.createKeyPair()

    const fees = this.calcFees({
      opType: 'dmt',
      keyPairInfo,
      atomPayload,
      receiveAddress: payload.address,
      satsbyte: payload.satsbyte,
      dmtOptions: {
        ticker: payload.name,
        mintAmount: token.mintAmount,
      },
    })

    const orderId = await this.createOrder(
      ctx,
      OrderType.MintDFT,
      payload.address,
      keyPair,
      {
        atomPayload,
        fees,
        satsbyte: payload.satsbyte,
      }
    )

    await cache.hset('payments', {
      [orderId]: JSON.stringify({
        address: keyPair.address,
        amount: fees.commitAndRevealFeePlusOutputs,
        opType: 'dmt',
        expiredAt: Date.now() + ORDER_EXPIRATION,
      }),
    })

    return {
      orderId,
      payAddress: keyPair.address,
      status: OrderStatus.Pending,
      fees,
    }
  }

  @Post('/mint-nft')
  @Payload(MintNFTPayload)
  async mintNFT(payload: MintNFTPayload, ctx: Ctx) {
    const atomPayload = {
      [payload.name]: payload.data,
    }

    const { keyPair, keyPairInfo } = await this.createKeyPair()

    const fees = this.calcFees({
      opType: 'nft',
      keyPairInfo,
      atomPayload,
      receiveAddress: payload.address,
      satsbyte: payload.satsbyte,
      // TODO custom satsoutput
      nftOptions: {
        satsoutput: 546,
      },
    })

    const orderId = await this.createOrder(
      ctx,
      OrderType.MintDFT,
      payload.address,
      keyPair,
      {
        atomPayload,
        fees,
        satsbyte: payload.satsbyte,
      }
    )

    await cache.hset('payments', {
      [orderId]: JSON.stringify({
        address: keyPair.address,
        amount: fees.commitAndRevealFeePlusOutputs,
        opType: 'nft',
        expiredAt: Date.now() + ORDER_EXPIRATION,
      }),
    })

    return {
      orderId,
      payAddress: keyPair.address,
      status: OrderStatus.Pending,
      fees,
    }
  }

  static async buildAtomical(
    opType: OpType,
    orderId: string,
    utxo: any,
    sequence?: number
  ) {
    const order = await Order.findOneBy({ id: orderId })
    const { keyPair, receiveAddress, metadata } = order
    const { atomPayload, fees, satsbyte } = metadata
    
    if (opType === 'nft') {
      for (const key in atomPayload) {
        const base64Data = atomPayload[key] .split(',')[1]
        atomPayload[key] = Buffer.from(base64Data, 'base64')
      }
    }

    const keyPairInfo = getKeypairInfo(ECPair.fromWIF(keyPair.WIF))
    const config = prepareCommitRevealConfig(
      opType,
      keyPairInfo,
      new AtomicalsPayload(atomPayload),
      false
    )

    // Mining
    if (sequence === undefined) {
      const mineResult = mine(
        JSON.stringify({
          privateKey: keyPair.privateKey,
          utxoTxid: utxo.txid,
          utxoVout: utxo.vout,
          utxoValue: utxo.value,
          // @ts-ignore
          utxoScriptPubkey: keyPairInfo.output.toString('hex'),
          outputValue: fees.revealFeePlusOutputs,
          outputScriptPubkey: config.scriptP2TR.output.toString('hex'),
          bitworkc: '0000',
          seqStart: 0,
          seqEnd: bitcoin.Transaction.DEFAULT_SEQUENCE,
        })
      )
      sequence = JSON.parse(mineResult).sequence
    }

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
        address: config.scriptP2TR.address,
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
          `Build atomical ${opType} error`,
          `${orderId}: broadcast commit tx failed`
        )
        return
      }
      commitTxid = result.data
      hashLockP2TR = config.hashLockP2TR
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
        value: fees.revealFeePlusOutputs - fees.revealFeeOnly,
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
          `Build atomical ${opType} error`,
          `${orderId}: broadcast reveal tx failed`
        )
        return
      }

      metadata.commitTxid = commitTxid
      metadata.revealTxid = result.data
      order.status = OrderStatus.Completed
      await order.save()

      sendNotification('New Dft', `${atomPayload.name}`)
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
