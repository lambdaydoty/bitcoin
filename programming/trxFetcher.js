const { get } = require('../utils')
const { when } = require('ramda')

/*
 * https://www.blockcypher.com/dev/bitcoin/#introduction
 */

// TODO: cache the result
module.exports = async function (_txid, testnet = false) {
  const txid = when(Buffer.isBuffer, x => x.toString('hex'))(_txid)
  const network = testnet ? 'test3' : 'main'
  const url = `https://api.blockcypher.com/v1/btc/${network}/txs/${txid}?includeHex=true`
  const { hex } = await get(url)
  return Buffer.from(hex, 'hex')
}
