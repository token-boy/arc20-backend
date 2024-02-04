import { MAX_SEQUENCE } from 'atomicals/utils/atomical-operation-builder'

import initStorage, { Order, cache } from 'database'
import { sendNotification } from 'helpers/notification'
import AtomicalController, { atomicals } from 'controllers/AtomicalController'
import initMiner from 'helpers/miner'
import { OrderStatus } from 'helpers/constants'

await initStorage()
initMiner()

Object.defineProperty(global, 'reportProcess', {
  value: (s: string) => {
    console.log(s)
  },
})

setInterval(async () => {
  const payments = await cache.hgetall('payments')
  for (const [orderId, paymentRaw] of Object.entries(payments)) {
    try {
      const payment = JSON.parse(paymentRaw)
      const result = await atomicals.getUtxos(payment.address)
      const data = result as unknown as {
        unconfirmed: number
        confirmed: number
        utxos: any[]
      }

      if (data.utxos.length == 0) {
        continue
      }
      const utxo = data.utxos[0]
      if (payment.amount < utxo.value) {
        sendNotification('Utxo listener warning', `${orderId}: Pay error`)
        continue
      }
      if (payment.expiredAt < Date.now()) {
        await Order.update({ id: orderId }, { status: OrderStatus.Timeout })
        await cache.hdel('payments', orderId)
        sendNotification('Utxo listener warning', `${orderId}: timeout`)
        continue
      }

      await cache.hdel('payments', orderId)
      if (payment.opType === 'dmt') {
        await Order.update(
          { id: orderId },
          { status: OrderStatus.WaitForMining, utxo }
        )
      } else {
        let sequence = undefined
        if (payment.opType === 'nft') {
          sequence = MAX_SEQUENCE
        }
        AtomicalController.buildAtomical(
          payment.opType,
          orderId,
          utxo,
          sequence
        )
      }
    } catch (error) {
      sendNotification('Utxo listener error', error.message)
    }
  }
}, 3000)

console.log('Utxo listener started')
