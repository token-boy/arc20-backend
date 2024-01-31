import bitcoin from 'bitcoinjs-lib'

export enum TokenProtocal {
  BRC20 = 1,
  ARC20 = 2,
  RUNE = 3,
}

export enum OrderType {
  InitDFT = 1,
}

export enum OrderStatus {
  Pending = 1,
  Timeout = 2,
  Completed = 3,
}

export const UINT_MAX = 2 ** 32 - 1
export const UINT8_MAX = 2 ** 64 - 1

export const NETWORK =
  process.env.NODE_ENV === 'development'
    ? bitcoin.networks.regtest
    : bitcoin.networks.bitcoin

export const ORDER_EXPIRATION = 2 * 60 * 60 * 1000
