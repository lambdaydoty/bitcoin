const R = require('ramda')
const { always, pipe } = R
const bs58 = require('bs58')
const sha256 = require('./sha256')
const ripemd160 = require('./ripemd160')
const concat = require('./concat')
const first4 = b => b.slice(0, 4)

function toAddress (pub) {
  const prefix = Buffer.from([0])
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
    Buffer.from('0275e9b1369179c24935337d597a06df0e388b53e8ac3f10ee426431d1a90c1b6e', 'hex')
  )
)
