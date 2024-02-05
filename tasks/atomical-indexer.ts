import { Atomicals, ElectrumApi } from 'atomicals'
import type { CommandResultInterface } from 'atomicals/commands/command-result.interface'

import initStorage, { NFT, Token } from 'database'
import { NFTProtocal, TokenProtocal } from 'helpers/constants'
import { Http500 } from 'helpers/http'
import { sendNotification } from 'helpers/notification'

const atom = new Atomicals(
  ElectrumApi.createClient(process.env.ELECTRUMX_PROXY_BASE_URL)
)

function resolveData(result: CommandResultInterface) {
  if (!result.success) {
    throw new Http500(100000, result.message)
  }
  return result.data
}

async function syncARC20() {
  const tokens = await Token.find({
    where: { protocal: TokenProtocal.ARC20 },
    select: ['id', 'commitTx', 'outputIndex'],
  })
  for (const token of tokens) {
    console.log(`syncARC20: ${token.commitTx}i${token.outputIndex}`)

    try {
      const ftInfoResult = await atom.getAtomicalFtInfo(
        `${token.commitTx}i${token.outputIndex}`
      )
      const ftInfo = resolveData(ftInfoResult).result
      const isDFT = !!ftInfo.dft_info
      token.mintCount = isDFT ? ftInfo.dft_info.mint_count : 1
      token.holders = ftInfo.location_summary.unique_holders
      token.confirmed = ftInfo.$request_ticker_status.status === 'verified'
      token.save()
    } catch (error) {
      sendNotification('Sync ARC20 error', error.message)
    }
  }
}

async function indexer() {
  const result = await atom.list(20, -20, true)
  const atomicals = resolveData(result).result
  for (const atomical of atomicals) {
    try {
      if (atomical.type === 'FT') {
        let token = await Token.findOneBy({
          commitTx: atomical.mint_info.commit_txid,
        })
        const ftInfoResult = await atom.getAtomicalFtInfo(atomical.atomical_id)
        const ftInfo = resolveData(ftInfoResult).result
        const isDFT = !!ftInfo.dft_info

        if (token === null) {
          token = new Token()
          token.name = ftInfo.mint_info.args.request_ticker
          token.index = ftInfo.atomical_number
          token.protocal = TokenProtocal.ARC20
          token.mintAmount = isDFT
            ? ftInfo.mint_info.args.mint_amount
            : ftInfo.$max_supply
          token.maxMints = isDFT ? ftInfo.mint_info.args.max_mints : 1
          token.supply = ftInfo.$max_supply
          token.mintCount = isDFT ? ftInfo.dft_info.mint_count : 1
          token.burned = 0
          token.holders = ftInfo.location_summary.unique_holders
          token.bitworkc = ftInfo.mint_info.args.mint_bitworkc ?? ''
          token.bitworkr = ftInfo.mint_info.args.mint_bitworkr ?? ''
          token.deployBlock = ftInfo.mint_info.commit_height
          token.deployer = ftInfo.mint_info.reveal_location_address
          token.deployedAt = new Date(ftInfo.mint_info.args.time * 1000)
          token.confirmed = ftInfo.$request_ticker_status.status === 'verified'
          token.mintHeight = ftInfo.mint_info.args.mint_height ?? 0
          token.commitTx = ftInfo.mint_info.commit_txid
          token.revealTx = ftInfo.mint_info.reveal_location_txid
          token.outputIndex = ftInfo.mint_info.commit_index

          delete ftInfo.mint_data.fields.args
          token.metadata = ftInfo.mint_data.fields

          console.log(
            `New Token: ${token.commitTx}i${token.outputIndex} ${token.name}`
          )
  
          token.save()
        }
      } else if (atomical.type === 'NFT') {
        // Static file
        if (!atomical.mint_data.fields.args) {
          const nft = await NFT.findOneBy({
            commitTx: atomical.mint_info.commit_txid,
          })
          if (nft === null) {
            const nft = new NFT()
            const name = Object.keys(atomical.mint_data.fields)[0]
            nft.name = name
            nft.index = atomical.atomical_number
            nft.protocal = NFTProtocal.Atomicals
            nft.owner = atomical.mint_info.reveal_location_address
            nft.mintAt = new Date(
              atomical.mint_info.blockheader_info.timestamp * 1000
            )
            nft.commitTx = atomical.mint_info.commit_txid
            nft.revealTx = atomical.mint_info.reveal_location_txid
            nft.outputIndex = atomical.mint_info.commit_index

            delete atomical.mint_data.fields[name].$b
            nft.metadata = atomical.mint_data.fields
            
            console.log(
              `New NFT: ${nft.commitTx}i${nft.outputIndex} ${nft.name}`
            )

            nft.save()
          }
        }
      }
    } catch (error) {
      sendNotification('Indexer error', error.message)
    }
  }
}

try {
  await initStorage()
  setInterval(indexer, 1000 * 60 * 10)
  setInterval(syncARC20, 1000 * 60 * 5)
} catch (error) {
  sendNotification('Atomical indexer error', error.message)
}
