class Output {
  constructor (amount, scriptPubkey) {
    this.amount = amount
    this.scriptPubkey = scriptPubkey
  }

  toString () {
    return `
      amount: ${this.amount}
      scriptPubkey: ${this.scriptPubkey.toString('hex')}
    `
  }
}

module.exports = Output
