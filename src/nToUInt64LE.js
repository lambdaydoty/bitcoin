const { bn } = require('../utils')

const nToUInt64LE = (/* Bignumber.js */ n) => {
  const reversedHex = bn(n)
    .toString(16)
    .padStart(16, '0') // 8 bytes
    .match(/../g)
    .reverse()
    .join('')
  return Buffer.from(reversedHex, 'hex')
}

module.exports = nToUInt64LE
