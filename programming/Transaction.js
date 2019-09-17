const { hash256, nToVarint } = require('../utils')
const Input = require('./Input')
const Output = require('./Output')
// const Script = require('./Script')
const trxParser = require('./trxParser')
const { concat, invoker } = require('ramda')

class Transaction {
  constructor (version, txIns, txOuts, locktime, testnet = false) {
    this.version = version
    this.txIns = txIns
    this.txOuts = txOuts
    this.locktime = locktime
    this.testnet = testnet
  }

  toString () {
    return `
      id: ${this.id()}
      version: ${this.version.toNumber()}
      txIns: ${this.txIns}
      txOuts: ${this.txOuts}
      locktime: ${this.locktime.toNumber()}
    `
  }

  id () {
    return hash256(this.serialize()).reverse().toString('hex')
  }

  serialize () {
    const serialize = invoker(0, 'serialize')
    return Buffer.concat([
      this.version.toBuffer('le', 4),
      nToVarint(this.txIns.length),
      this.txIns.map(serialize).reduce(concat),
      nToVarint(this.txOuts.length),
      this.txOuts.map(serialize).reduce(concat),
      this.locktime.toBuffer('le', 4),
    ])
  }

  async fee () {
    const sum = invoker(1, 'add')
    const { txIns, txOuts, testnet } = this
    const totalIns = await Promise.all(txIns.map(x => x.value(testnet)))
    const totalOuts = txOuts.map(x => x.amount)
    return totalIns.reduce(sum).sub(
      totalOuts.reduce(sum)
    )
  }

  static parse (stream, testnet) {
    const { version, inputs, outputs, locktime } = trxParser(stream, testnet)
    return new Transaction(
      version,
      inputs.map(data => new Input(...data)),
      outputs.map(data => new Output(...data)),
      locktime,
      testnet,
    )
  }
}

module.exports = Transaction
