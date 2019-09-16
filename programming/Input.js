const Script = require('./Script')
const BN = require('bn.js')

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
}

module.exports = Input
