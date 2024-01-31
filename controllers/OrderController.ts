import { Order } from 'database'
import { Controller, Get, Model } from 'helpers/route'

@Controller('/orders')
class OrderController {
  @Get('/:id')
  @Model(Order)
  async getOne(order: Order) {
    return {
      id: order.id,
      type: order.type,
      status: order.status,
      metadata: order.metadata,
      createdAt: order.createdAt,
    }
  }
}

export default OrderController
