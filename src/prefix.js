const hexNotationToBE = require('./hexNotationToBE')
const versionBytes = {
  'mainnet-bip32-xpub': '0488B21E',
  'mainnet-bip32-xprv': '0488ADE4',
  'testnet-bip32-tpub': '043587CF',
  'testnet-bip32-tprv': '04358394',
}
module.exports = {
  xprv: hexNotationToBE(versionBytes['mainnet-bip32-xprv']),
  xpub: hexNotationToBE(versionBytes['mainnet-bip32-xpub']),
  tprv: hexNotationToBE(versionBytes['testnet-bip32-tprv']),
  tpub: hexNotationToBE(versionBytes['testnet-bip32-tpub']),
  tp2pkh: hexNotationToBE('6F'),
  tcWIF: hexNotationToBE('EF'),
  cWIF: hexNotationToBE('80'),
}
