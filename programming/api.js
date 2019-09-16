const { get, bToStream } = require('../utils')
const Transaction = require('./Transaction')

module.exports = {
  trxFetcher,
}

/*
 * https://www.blockcypher.com/dev/bitcoin/#introduction
 */

async function trxFetcher (txid, testnet = false) {
  const network = testnet ? 'test3' : 'main'
  const url = `https://api.blockcypher.com/v1/btc/${network}/txs/${txid}?includeHex=true`
  const { hex } = await get(url)
  const trx = Transaction.parse(bToStream(Buffer.from(hex, 'hex')), testnet)
  return trx
}
