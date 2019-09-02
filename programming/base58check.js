const R = require('ramda')
const { o, pipe } = R
const { hash256, concat, concatN } = require('../utils')
const bs58 = require('bs58')
const first4 = b => b.slice(0, 4)

function base58check (prefix, suffix = Buffer.from([])) {
  return function (payload) {
    const fn = pipe(
      x => [
        x,
        o(first4, hash256)(x),
      ],
      list => concat(...list),
      bs58.encode,
    )

    return fn(concatN(prefix, payload, suffix))
  }
}

module.exports = base58check
