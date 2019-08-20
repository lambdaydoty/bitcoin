const R = require('ramda')
const { curryN, always, pipe } = R
const bs58 = require('bs58')
const sha256 = require('./sha256')
const concat = require('./concat')
const first4 = b => b.slice(0, 4)

function base58check (prefix, payload) {
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

module.exports = curryN(2, base58check)
