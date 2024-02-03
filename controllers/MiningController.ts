import { getKeypairInfo } from 'atomicals/utils/address-keypair-path'
import {
  AtomicalsPayload,
  prepareCommitRevealConfig,
} from 'atomicals/commands/command-helpers'
import bitcoin from 'bitcoinjs-lib'
import { ECPairFactory } from 'ecpair'
import * as curve from 'tiny-secp256k1'

import { Order } from 'database'
import { Http400, Http404 } from 'helpers/http'
import { Controller, Get, Payload, Post } from 'helpers/route'
import Input, { Field } from 'helpers/input'

import AtomicalController from './AtomicalController'

bitcoin.initEccLib(curve)
const ECPair = ECPairFactory(curve)

class FinishMiningPayload extends Input {
  @Field({ type: 'string', required: true })
  orderId!: string

  @Field({ type: 'number', required: true })
  sequence: number
}

@Controller('/mining')
class MiningController {
  private async getOrder(orderId: string, ctx: Ctx) {
    const sessionId = ctx.get('X-Session-Id')

    const order = await Order.findOneBy({ id: orderId })
    if (!order) {
      throw new Http404('Order not found')
    }
    if (
      order.sessionId !== sessionId &&
      order.receiveAddress !== ctx.query.receiveAddress
    ) {
      throw new Http400(400, 'This order is not yours')
    }

    return order
  }

  @Get('')
  async getOne(ctx: Ctx) {
    const order = await this.getOrder(ctx.query.orderId as string, ctx)

    const keyPairInfo = getKeypairInfo(ECPair.fromWIF(order.keyPair.WIF))
    const config = prepareCommitRevealConfig(
      'dmt',
      keyPairInfo,
      new AtomicalsPayload(order.metadata.atomPayload),
      false
    )

    const data = {
      privateKey: order.keyPair.privateKey,
      utxoTxid: order.utxo.txid,
      utxoVout: order.utxo.vout,
      utxoValue: order.utxo.value,
      // @ts-ignore
      utxoScriptPubkey: keyPairInfo.output.toString('hex'),
      outputValue: order.metadata.fees.revealFeePlusOutputs,
      outputScriptPubkey: config.scriptP2TR.output.toString('hex'),
      bitworkc: order.metadata.atomPayload.args.bitworkc,
    }

    return data
  }

  @Post('/finish')
  @Payload(FinishMiningPayload)
  async finishMining(payload: FinishMiningPayload, ctx: Ctx) {
    const order = await this.getOrder(payload.orderId as string, ctx)

    await AtomicalController.buildAtomical(
      'dmt',
      order.id,
      order.utxo,
      payload.sequence
    )
  }
}

export default MiningController
