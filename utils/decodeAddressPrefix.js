/*
 * https://en.bitcoin.it/wiki/List_of_address_prefixes
 * https://javascript.info/regexp-groups
 */

const presuffix = {

  p2pkh: /(?<prefix>^00)(?<data>.+$)/,
  p2sh: /(?<prefix>^05)(?<data>.+$)/,
  uWIF: /(?<prefix>^80)(?<data>.{64}$)/,
  cWIF: /(?<prefix>^80)(?<data>.{64})(?<suffix>01$)/,

  tp2pkh: /(?<prefix>^6f)(?<data>.+$)/,
  tp2sh: /(?<prefix>^c4)(?<data>.+$)/,
  tuWIF: /(?<prefix>^ef)(?<data>.{64}$)/,
  tcWIF: /(?<prefix>^ef)(?<data>.{64})(?<suffix>01$)/,

  // bip32...
  // bech32...
}

module.exports = function (type, buf) {
  console.log({ type, buf })
  const hex = buf.toString('hex')
  const { groups: { data } } = hex.match(presuffix[type])
  return Buffer.from(data, 'hex')
}
