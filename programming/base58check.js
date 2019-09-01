const R = require('ramda')
const { o, curryN, always, pipe } = R
const { hash256, concat } = require('../utils')
const bs58 = require('bs58')
const first4 = b => b.slice(0, 4)

function base58check (prefix, payload) {
  return pipe(
    always(payload),
    concat(prefix),
    x => [
      x,
      o(first4, hash256)(x),
    ],
    list => concat(...list),
    bs58.encode,
  )()
}

module.exports = curryN(2, base58check)
