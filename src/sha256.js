const R = require('ramda')
const { pipe, always } = R
const toHexString = require('./toHexString')

const crypto = require('crypto')
const sha256 = b => crypto
  .createHash('sha256')
  .update(b)
  .digest()

pipe(
  always('hello world'),
  Buffer.from,
  sha256,
  toHexString,
)()

module.exports = sha256
