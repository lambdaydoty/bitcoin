function Script () {}

class Input {
  constructor (prevTrx, prevIndex, scriptSig, sequence = 0xffffffff) {
    this.prevTrx = prevTrx
    this.prevIndex = prevIndex
    this.scriptSig = scriptSig || Script()
    this.sequence = sequence
  }

  toString () {
    return `
      prevTrx: ${this.prevTrx.toString('hex')}
      prevIndex: ${this.prevIndex}
      scriptSig: ${this.scriptSig.toString('hex')}
    `
  }
}

module.exports = Input
