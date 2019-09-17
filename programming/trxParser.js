const { parseVarintToBN } = require('../utils')
const { bToStream } = require('../utils')
const { when } = require('ramda')
const Script = require('./Script')

module.exports = function (_stream, testnet = false) {
  const stream = when(Buffer.isBuffer, bToStream)(_stream)
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

  return { version, inputs, outputs, locktime }

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
      return [ prevTrx, prevIndex, scriptSig, sequence ]
      // return new Input(prevTrx, prevIndex, scriptSig, sequence)

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
      return [ amount, scriptPubkey ]
    }
  }
}
