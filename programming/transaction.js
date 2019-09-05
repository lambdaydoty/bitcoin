const { hash256, bToBN } = require('../utils')

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
    /**
     * SIDE EFFECT
     * all functions prefixed with parse-
     * have the side effect of consuming the
     * input stream
     */
    const version = parseVersion(stream)
    const inputs = parseInputs(stream)
    const outputs = parseOutputs(stream)
    const locktime = parseLocktime(stream)
    return new Transaction(version, inputs, outputs, locktime)

    function parseVersion (s) {
      return s.read(4).toBN('le').toNumber()
    }

    function parseLocktime (s) {
      return s.read(4).toBN('le').toNumber()
    }

    function parseInputs (s) {
      const n = parseVarintToBN(s).toNumber()
      function * inputGenerator (s, n) {
        while (n--) yield parseAnInput(s) // FIXME: async?
      }
      return [...inputGenerator(s, n)]

      function parseAnInput (s) {
        const { bToStream, concat, safeEval } = require('../utils')
        const prevTrx = s.read(32).reverse()
        const prevIndex = s.read(4).toBN('le').toNumber()
        const m = parseVarintToBN(s).toNumber()
        const scriptSig = concat(...parseScript(bToStream(s.read(m))))
        const sequence = s.read(4).toBN('le')
        return new Input(prevTrx, prevIndex, scriptSig, sequence)

        function * parseScript (s) {
          /* will exhaust stream s */
          const next = safeEval(() => parseVarintToBN(s).toNumber())
          for (let n = next(); n; n = next()) {
            const b = s.read(n)
            yield b
          }
        }
      }
    }

    function parseOutputs (s) {
      const n = parseVarintToBN(s).toNumber()
      function * outputGenerator (s, n) {
        while (n--) yield parseAnOutput(s) // FIXME: async?
      }
      return [...outputGenerator(s, n)]

      function parseAnOutput (s) {
        const amount = s.read(8).toBN('le').toNumber() // FIXME: integer width
        const m = parseVarintToBN(s).toNumber()
        const scriptPubkey = s.read(m)
        return new Output(amount, scriptPubkey)
      }
    }
  }

  static parseVarintToBN (s) { return parseVarintToBN(s) }
  static nToVarint (n) { return nToVarint(n) }
}

function Script () {}

module.exports = Transaction

const nextTwoBytes = Buffer.from([0xfd])
const nextFourBytes = Buffer.from([0xfe])
const nextEightBytes = Buffer.from([0xff])

function parseVarintToBN (/* stream */ stream) {
  const { Readable } = require('stream')
  const assert = require('assert')
  const { always, equals, compose: o, invoker, cond, T, isNil } = require('ramda')

  assert.ok(stream instanceof Readable)

  const readS = invoker(1, 'read')

  return cond([
    [isNil, always(null)],
    [equals(nextTwoBytes), o(bToBN('le'), readS(2), always(stream))],
    [equals(nextFourBytes), o(bToBN('le'), readS(4), always(stream))],
    [equals(nextEightBytes), o(bToBN('le'), readS(8), always(stream))],
    [T, bToBN('le')],
  ])(readS(1)(stream))
}

/**
 * @return {Buffer}
 */
function nToVarint (_n) {
  const BN = require('bn.js')
  const { compose: o, invoker, cond, T } = require('ramda')
  const { concat } = require('../utils')

  const _0xfd = new BN('fd', 16)
  const _0x10000 = new BN('10000', 16)
  const _0x100000000 = new BN('100000000', 16)
  const _0x10000000000000000 = new BN('10000000000000000', 16)

  const lt = invoker(1, 'lt')
  const toBuffer = invoker(2, 'toBuffer')

  return cond([
    [lt(_0xfd), toBuffer('le', 1)],
    [lt(_0x10000), o(concat(nextTwoBytes), toBuffer('le', 2))],
    [lt(_0x100000000), o(concat(nextFourBytes), toBuffer('le', 4))],
    [lt(_0x10000000000000000), o(concat(nextEightBytes), toBuffer('le', 8))],
    [T, () => { throw new Error(_n) }],
  ])(new BN(_n))
}
