const R = require('ramda')
const { curryN } = R
const { createHmac } = require('crypto')

function hmacSHA512 (key, data) {
  return createHmac('sha512', key)
    .update(data)
    .digest()
}

module.exports = curryN(2, hmacSHA512)
