const R = require('ramda')
const { pipe, always } = R

const nToInt32LE = require('./nToInt32LE')
const sha256 = require('./sha256')
const concat = require('./concat')
const toHexString = require('./toHexString')

const n = 1000
const message = Buffer.from('hello world')

pipe(
  always(n),
  nToInt32LE,
  concat(message),
  sha256,
  toHexString,
)()
