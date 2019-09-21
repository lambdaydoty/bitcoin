const assert = require('assert')
const bs58 = require('bs58')
const { hash256, concatN, concat } = require('../utils')
const { pipe, o, tryCatch, always } = require('ramda')
/*
 * https://en.bitcoin.it/wiki/List_of_address_prefixes
 * https://javascript.info/regexp-groups
 */

const regexes = {

  p2pkh: /(?<prefix>^00)(?<data>.+$)/,
  p2sh: /(?<prefix>^05)(?<data>.+$)/,
  uWIF: /(?<prefix>^80)(?<data>.{64}$)/,
  cWIF: /(?<prefix>^80)(?<data>.{64})(?<suffix>01$)/,

  tp2pkh: /(?<prefix>^6f)(?<data>.+$)/,
  tp2sh: /(?<prefix>^c4)(?<data>.+$)/,
  tuWIF: /(?<prefix>^ef)(?<data>.{64}$)/,
  tcWIF: /(?<prefix>^ef)(?<data>.{64})(?<suffix>01$)/,

  // bip32...
  // bech32...

}

/*
 * helpers to extract prefix/suffix from regexes
 */
const getPrefix = reg => reg
  .toString()
  .replace(/[()?/]/g)
  .match(/<prefix>\^(\w+)/)[1]

const getSuffix = tryCatch(
  reg => reg
    .toString()
    .replace(/[()?/]/g)
    .match(/<suffix>(\w+)\$/)[1],
  always(''),
)

module.exports = {

  /*
   * @param {string} type - Eg. 'p2pkh', ...
   * @param {Buffer} buf - Buffer to be encoded
   * @return {string} Encoded human-readable string with  prefix, suffix and checksum
   */
  toBs58Check (type, buf) {
    const first4 = b => b.slice(0, 4)
    const fn = pipe(
      x => [x, o(first4, hash256)(x)],
      list => concat(...list),
      bs58.encode,
    )
    return fn(concatN(
      Buffer.from(getPrefix(regexes[type]), 'hex'),
      buf,
      Buffer.from(getSuffix(regexes[type]), 'hex'),
    ))
  },

  /*
   * @param {string} type - Eg. 'p2pkh', ...
   * @param {string} str - Eg. 'mzx5YhAH9kNHtcN481u6WkjeHjYtVeKVh2'
   * @return {Buffer} Decoded buffer without prefix, suffix
   */
  fromBs58Check (type, str) {
    const b = bs58.decode(str)
    const n = b.length
    const [payload, checksum] = [b.slice(0, n - 4), b.slice(n - 4, n)]

    assert.deepStrictEqual(hash256(payload).slice(0, 4), checksum)

    const hex = payload.toString('hex')
    const { groups: { data } } = hex.match(regexes[type])
    return Buffer.from(data, 'hex')
  },

  regexes,
}
