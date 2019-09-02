const { hash256, bToBN } = require('../utils')

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
      version: ${this.version}
      txIns: ${this.txIns}
      txOuts: ${this.txOuts}
      locktime: ${this.locktime}

    `
  }

  id () {
    return hash256(this.serialize()).toString('hex')
  }

  serialize () {
    return Buffer.from([])
  }

  static parse (stream) {
    const version = bToBN('le')(stream.read(4)).toNumber()
    return new Transaction(version)
  }

  static varintToN (s) { return varintToN(s) }
}

module.exports = Transaction

function varintToN (s) {
  const R = require('ramda')
  const { always, equals, compose: o, invoker, cond, T } = R

  const nextTwoBytes = Buffer.from([0xfd])
  const nextFourBytes = Buffer.from([0xfe])
  const nextEightBytes = Buffer.from([0xff])

  const toNumber = invoker(0, 'toNumber')
  const read = invoker(1, 'read')

  const readNparse = n => o(toNumber, bToBN('le'), read(n))

  return cond([
    [equals(nextTwoBytes), o(readNparse(2), always(s))],
    [equals(nextFourBytes), o(readNparse(4), always(s))],
    [equals(nextEightBytes), o(readNparse(8), always(s))],
    [T, o(toNumber, bToBN('le'))],
  ])(s.read(1))
}

// function nToVarint (n) {
// }
