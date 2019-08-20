const R = require('ramda')
const { pipe, match, map } = R
const { bn } = require('../utils')
const words = require('./words')
const sha256 = require('./sha256')
const crypto = require('crypto')

/*
 * entropy: hexNotation
 * cks: hexNotation
 */

const binToNumber = x => bn(`0b${x}`).toNumber()
const hexNotationToBin = x => bn(`0x${x}`).toString(2).padStart(x.length * 8 / 2, '0')

const cks = entropy => sha256(Buffer.from(entropy, 'hex'))
  .toString('hex')
  .slice(0, entropy.length / 2 * 8 / 32 / 4)

const indexes = pipe(
  e => `${e}${cks(e)}`,
  hexNotationToBin,
  match(/.{1,11}/g),
  map(binToNumber),
)

function entropyToMnemonic (/* hexNotation */ entropy, bits = 128) {
  const _e = entropy || crypto.randomBytes(bits / 8).toString('hex')
  const e = _e.replace(/(\n|\s)/mg, '')
  const mnemonic = indexes(e)
    .map(i => words[i])
    .join(' ')
  return mnemonic
}

module.exports = entropyToMnemonic
