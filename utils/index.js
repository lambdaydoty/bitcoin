const BN = require('bignumber.js')

function bn (value) {
  const _val = value instanceof Buffer
    ? `0x${value.toString('hex')}`
    : value.toString()
  return new BN(_val)
}

BN.prototype.toBigEndian = function (bits = 256) {
  const nibble = bits / 4
  return Buffer.from(
    this.toString(16).padStart(nibble, '0').slice(-nibble),
    'hex',
  )
}

module.exports = { bn }
