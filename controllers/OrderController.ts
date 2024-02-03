import { Order } from 'database'
import { OrderStatus, OrderType } from 'helpers/constants'
import Input, { Field } from 'helpers/input'
import { Controller, Get, Model, QueryParams } from 'helpers/route'

class GetListQuery extends Input {
  @Field({ type: 'number' })
  type?: OrderType

  @Field({ type: 'number' })
  status?: OrderStatus
}

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

  @Get('')
  @QueryParams(GetListQuery)
  async getList(query: GetListQuery, ctx: Ctx) {
    const sessionId = ctx.get('X-Session-Id')

    const where: Dict = {}
    if (sessionId) {
      where.sessionId = sessionId
    }
    if (query.type) {
      where.type = query.type
    }
    if (query.status) {
      where.status = query.status
    }

    const orders = await Order.find({
      where,
      select: [
        'id',
        'type',
        'status',
        'receiveAddress',
        'keyPair',
        'metadata',
        'createdAt',
        'expiredAt',
      ],
    })
    return orders
  }
}

export default OrderController
