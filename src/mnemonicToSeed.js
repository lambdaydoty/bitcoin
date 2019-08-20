const pbkdf2 = require('pbkdf2')

function mnemonicToSeed (/* utf8 */ mnemonic, password = '') {
  return pbkdf2.pbkdf2Sync(
    Buffer.from(mnemonic, 'utf8'),
    Buffer.from('mnemonic' + password, 'utf8'),
    2048,
    64,
    'sha512',
  )
}

module.exports = mnemonicToSeed
