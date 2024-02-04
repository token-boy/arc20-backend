import { NFT } from 'database'
import { NFTProtocal } from 'helpers/constants'
import { Http400, Http404 } from 'helpers/http'
import { Controller, Get } from 'helpers/route'

@Controller('/nfts')
class NFTController {
  @Get('')
  getList() {
    return NFT.find({
      select: ['id', 'name', 'index', 'commitTx', 'metadata'],
    })
  }

  @Get('/:tx')
  async getOne(ctx: Ctx) {
    const { tx } = ctx.params
    if (!tx) {
      throw new Http400(400, 'Invalid name')
    }
    const nft = await NFT.findOneBy({
      commitTx: tx,
      protocal: NFTProtocal.Atomicals,
    })
    if (!nft) {
      throw new Http404(`NFT ${tx} not found`)
    }
    return nft
  }
}

export default NFTController
