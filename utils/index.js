const R = require('ramda')
const BN = require('bn.js')
const crypto = require('crypto')
const { o } = R

module.exports = {
  nToBE,
  hash256: o(sha256, sha256),
  sha256,
  toHex,
  hexToBE,
}

function nToBE (n, bits = 256) {
  return new BN(n).toBuffer('be', bits / 8)
}

function sha256 (b) {
  return crypto
    .createHash('sha256')
    .update(b)
    .digest()
}

function toHex (b) {
  return b.toString('hex')
}

function hexToBE (hex, bits = 256) {
  const norm = hex
    .replace(/^0x/g, '')
    .replace(/(\n|\s)/mg, '')
    .padStart(bits / 4, '0')
  return Buffer.from(norm, 'hex')
}
