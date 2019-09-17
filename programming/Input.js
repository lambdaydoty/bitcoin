const Script = require('./Script')
const BN = require('bn.js')
const trxFetcher = require('./trxFetcher')
const trxParser = require('./trxParser')
const Output = require('./Output')

class Input {
  constructor (prevTrx, prevIndex, scriptSig, sequence) {
    this.prevTrx = prevTrx
    this.prevIndex = prevIndex
    this.scriptSig = scriptSig || new Script()
    this.sequence = sequence || new BN('ffffffff', 16)
  }

  toString () {
    return `
      prevTrx: ${this.prevTrx.toString('hex')}
      prevIndex: ${this.prevIndex.toNumber()}
      scriptSig: ${this.scriptSig.toString('hex')}
      sequence: ${this.sequence.toNumber()}
    `
  }

  serialize () {
    return Buffer.concat([
      this.prevTrx.reverse(),
      this.prevIndex.toBuffer('le', 4),
      this.scriptSig.serialize(),
      this.sequence.toBuffer('le', 4),
    ])
  }

  // fetch (testnet = false) {
  //   return trxFetcher(this)
  // }

  async value (testnet = false) {
    const that = this
    const raw = await trxFetcher(that.prevTrx, testnet)
    const { outputs: _txOuts } = trxParser(raw, testnet)
    const txOuts = _txOuts.map(x => new Output(...x))
    return txOuts[that.prevIndex].amount
  }
}

module.exports = Input
