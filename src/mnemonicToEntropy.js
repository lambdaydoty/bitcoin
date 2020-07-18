const R = require('ramda')
const { find, invertObj, propEq, always, split, join, pipe, map } = R
const { bn } = require('../utils')
const words = require('./words')

const lookup = [
  { entropy_bits: 128, checksum_bits: 4, mnemonic_length: 12 },
  { entropy_bits: 160, checksum_bits: 5, mnemonic_length: 15 },
  { entropy_bits: 192, checksum_bits: 6, mnemonic_length: 18 },
  { entropy_bits: 224, checksum_bits: 7, mnemonic_length: 21 },
  { entropy_bits: 256, checksum_bits: 8, mnemonic_length: 24 },
]

const numberTo11Bin = x => bn(x).toString(2).padStart(11, '0')

// const cks = entropy => sha256(Buffer.from(entropy, 'hex'))
//   .toString('hex')
//   .slice(0, entropy.length / 2 * 8 / 32 / 4)

function mnemonicToEntropy (/* utf8 */ mnemonic) {
  const wordToIndex = invertObj(words)
  const { entropy_bits: bits } = find(
    propEq('mnemonic_length', mnemonic.split(' ').length)
  )(lookup)
  return pipe(
    always(mnemonic),
    split(' '),
    map(w => wordToIndex[w]),
    map(numberTo11Bin),
    join(''),
    x => x.slice(0, bits),
    x => bn(x, 2).toString(16),
  )()
}

module.exports = mnemonicToEntropy
