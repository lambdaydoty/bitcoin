const Script = require('./Script')
const BN = require('bn.js')
const trxFetcher = require('./trxFetcher')
const trxParser = require('./trxParser')
const Output = require('./Output')
const R = require('ramda')

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

  clone () {
    return new Input(
      R.clone(this.prevTrx),
      R.clone(this.prevIndex),
      R.clone(this.scriptSig),
      R.clone(this.sequence),
    )
  }

  async txOutFetcher (testnet) {
    const that = this
    const raw = await trxFetcher(that.prevTrx, testnet)
    const { outputs } = trxParser(raw, testnet)
    const txOut = outputs.map(x => new Output(...x))[that.prevIndex]
    return txOut
  }

  async value (testnet = false) {
    return (await this.txOutFetcher(testnet)).amount
  }

  async scriptPubkey (testnet = false) {
    return (await this.txOutFetcher(testnet)).scriptPubkey
  }
}

module.exports = Input
