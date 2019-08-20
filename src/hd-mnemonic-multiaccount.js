/*
 * bip32
 * bip39
 * bip44
 */
const R = require('ramda')
const { always, pipe } = R
const bs58 = require('bs58')
const sha256 = require('./sha256')
const ripemd160 = require('./ripemd160')
const concat = require('./concat')
const first4 = b => b.slice(0, 4)

function toBs58check (prefix, payload) {
  return pipe(
    always(payload),
    concat(prefix),
    x => [
      x,
      pipe(sha256, sha256, first4)(x),
    ],
    list => concat(...list),
    bs58.encode,
  )()
}

// TODO
//
const prefix = {
  extPrivateKey: Buffer.from([0x04, 0x88, 0xAD, 0xE4].reverse()),
  p2pkhAddress: Buffer.from([0x00]),
}

function toAddress (pub) {
  const prefix = Buffer.from([0x00])
  const result = pipe(
    always(pub),
    sha256,
    ripemd160,
    concat(prefix),
    x => [
      x,
      pipe(sha256, sha256, first4)(x), // checksum
    ],
    list => concat(...list),
    bs58.encode,
  )()
  return result
}

console.log(
  toAddress(
    Buffer.from('0275e9b1369179c24935337d597a06df0e388b53e8ac3f10ee426431d1a90c1b6e', 'hex'),
  )
)

console.log(
  toBs58check(
    prefix.extPrivateKey,
    Buffer.from('b0342ec65f977acbe5da15aa6c9937ad269ab74e662872c226300ba5748acaf9a2ff9ac2883783674f28fe5b2d142a8d7a5213d020ffb69e068209dc43e14a98', 'hex'),
  )
)
