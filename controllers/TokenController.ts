import { Token } from 'database'
import { TokenProtocal } from 'helpers/constants'
import { Http400, Http404 } from 'helpers/http'
import { Controller, Get } from 'helpers/route'

@Controller('/tokens')
class TokenController {
  @Get('')
  getList() {
    return Token.find({
      select: [
        'id',
        'name',
        'index',
        'mintAmount',
        'maxMints',
        'mintCount',
        'supply',
        'holders',
        'confirmed',
        'bitworkc',
      ],
    })
  }

  @Get('/:name')
  async getOne(ctx: Ctx) {
    const { name } = ctx.params
    if (!name) {
      throw new Http400(400, 'Invalid name')
    }
    const token = await Token.findOneBy({ name, protocal: TokenProtocal.ARC20 })
    if (!token) {
      throw new Http404(`Token ${name} not found`)
    }
    return token
  }
}

export default TokenController
