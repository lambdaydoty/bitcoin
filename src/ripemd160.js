const crypto = require('crypto')
const ripemd160 = b => crypto
  .createHash('ripemd160')
  .update(b)
  .digest()

module.exports = ripemd160
