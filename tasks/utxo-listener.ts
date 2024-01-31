import initStorage, { Order } from 'database'

import { sendNotification } from 'helpers/notification'
import AtomicalController, { atomicals } from 'controllers/AtomicalController'
import initMiner from 'helpers/miner'
import { ORDER_EXPIRATION, OrderStatus } from 'helpers/constants'

await initStorage()
initMiner()

Object.defineProperty(global, 'reportProcess', {
  value: (s: string) => {
    console.log(s)
  },
})

process.on('message', async (message: any) => {
  const { channel } = message

  try {
    const { orderId, payAddress, utxoValue } = message
    if (channel === 'init-dft') {
      console.log(`Received init-dft message: ${orderId}`)
      let isExpired = false
      setTimeout(async () => {
        await Order.update({ id: orderId }, { status: OrderStatus.Timeout })
        sendNotification('Utxo listener warning', `${orderId}: timeout`)
        isExpired = true
      }, ORDER_EXPIRATION)
      const result = await atomicals.awaitUtxo(payAddress, utxoValue)
      if (result.success) {
        if (!isExpired) {
          AtomicalController.finishInitDft(orderId, result.data)
        }
      } else {
        sendNotification('Utxo listener error', `${orderId}: ${result.message}`)
      }
    }
  } catch (error) {
    sendNotification('Utxo listener error', error.message)
  }
})

console.log('Utxo listener started')
