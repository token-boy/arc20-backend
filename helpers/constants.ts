import bitcoin from 'bitcoinjs-lib'

export enum TokenProtocal {
  BRC20 = 1,
  ARC20 = 2,
  RUNE = 3,
}

export enum NFTProtocal {
  Ordinals = 1,
  Atomicals = 2,
}

export enum OrderType {
  InitDFT = 1,
  MintFT = 2,
  MintDFT = 3,
  MintNFT = 4,
}

export enum OrderStatus {
  Pending = 1,
  Timeout = 2,
  Completed = 3,
  WaitForMining = 4,
}

export const UINT_MAX = 2 ** 32 - 1
export const UINT8_MAX = 2 ** 64 - 1

export const NETWORK =
  process.env.NETWORK === 'regtest'
    ? bitcoin.networks.regtest
    : bitcoin.networks.bitcoin

export const ORDER_EXPIRATION = 2 * 60 * 60 * 1000
