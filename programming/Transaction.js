const { hash256, parseVarintToBN, nToVarint } = require('../utils')
const { bToStream } = require('../utils')
const Input = require('./Input')
const Output = require('./Output')
const Script = require('./Script')
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

  fee () {
  }

  static parse (stream, testnet) {
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
    return new Transaction(version, inputs, outputs, locktime, testnet)

    function parseVersion (s) {
      return s.read(4).toBN('le')
    }

    function parseLocktime (s) {
      return s.read(4).toBN('le')
    }

    function parseInputs (s) {
      const n = parseVarintToBN(s).toNumber()
      return [...inputGenerator(s, n)]

      function * inputGenerator (s, n) {
        while (n--) yield parseAnInput(s) // FIXME: async?
      }

      function parseAnInput (s) {
        const prevTrx = s.read(32).reverse()
        const prevIndex = s.read(4).toBN('le')
        const m = parseVarintToBN(s).toNumber()
        const scriptSig = Script.parse(bToStream(s.read(m)))
        const sequence = s.read(4).toBN('le')
        return new Input(prevTrx, prevIndex, scriptSig, sequence)

        // function * parseScript (s) {
        //   /* will exhaust stream s */
        //   const next = safeEval(() => parseVarintToBN(s).toNumber())
        //   for (let n = next(); n; n = next()) {
        //     const b = s.read(n)
        //     yield b
        //   }
        // }
      }
    }

    function parseOutputs (s) {
      const n = parseVarintToBN(s).toNumber()
      function * outputGenerator (s, n) {
        while (n--) yield parseAnOutput(s) // FIXME: async?
      }
      return [...outputGenerator(s, n)]

      function parseAnOutput (s) {
        const amount = s.read(8).toBN('le')
        const m = parseVarintToBN(s).toNumber()
        const scriptPubkey = Script.parse(bToStream(s.read(m)))
        return new Output(amount, scriptPubkey)
      }
    }
  }
}

module.exports = Transaction
