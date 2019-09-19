const { hash256, nToVarint, suffix } = require('../utils')
const Script = require('./Script')
const Input = require('./Input')
const Output = require('./Output')
// const Script = require('./Script')
const trxParser = require('./trxParser')
const R = require('ramda')
const { concat, invoker } = R

/*
 * Datatypes:
 *  Transaction
 *  Input
 *  Output
 *  Script
 *  Array
 *  Buffer
 *  BN (bn.js)
 */

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

  /*
   * NOTE:
   *  We need to implement clone methods for:
   *    1. Transaction
   *    2. Array (through prototyping)
   *    3. Input
   *    4. Output
   *    5. Script
   *  (Optional 6. Buffer, also through prototyping)
   */
  clone () {
    return new Transaction(
      R.clone(this.version),
      R.clone(this.txIns),
      R.clone(this.txOuts),
      R.clone(this.locktime),
      R.clone(this.testnet),
    )
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

  async sigHash (inputIndex) {
    const SIGHASH_ALL = Buffer.from('01000000', 'hex')
    const that = this
    const cloned = that.clone()

    /* !SIDE EFFECT! */
    for (let i = 0; i < cloned.txIns.length; ++i) {
      cloned.txIns[i].scriptSig = (i === inputIndex)
        ? await cloned.txIns[i].scriptPubkey(that.testnet)
        : new Script()
    }
    const raw = suffix(SIGHASH_ALL)(cloned.serialize())
    return hash256(raw)
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
