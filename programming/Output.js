const R = require('ramda')

class Output {
  constructor (amount, scriptPubkey) {
    this.amount = amount
    this.scriptPubkey = scriptPubkey
  }

  toString () {
    return `
      amount: ${this.amount.toNumber()}
      scriptPubkey: ${this.scriptPubkey.toString('hex')}
    `
  }

  serialize () {
    return Buffer.concat([
      this.amount.toBuffer('le', 8),
      this.scriptPubkey.serialize(),
    ])
  }

  clone () {
    return new Output(
      R.clone(this.amount),
      R.clone(this.scriptPubkey),
    )
  }
}

module.exports = Output
