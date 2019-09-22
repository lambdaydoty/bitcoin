const interpreter = require('./interpreter')
const R = require('ramda')
const { isNil, o, equals, type, __ } = R
const { test, T, cond, lt, both, gte } = R
const { nToLE, safeEval, concat, concatN, prefix, hexToBE, nToVarint } = require('../utils')
const inRange = (x, y) => n => both(gte(x), lt(y))
const isNumber = o(equals('Number'), type)

// func(x) . x==42
// const scriptSig0 = '0x2a 0x766b012a87'
// const scriptPubKey0 = 'OP_HASH160 0x53c3f130b2e0f8d9a3a5b6aaf71804543076d456 OP_EQUAL'
// const test1 = '10 2 3 0 OP_IF 6 OP_ADD OP_ELSE OP_IF OP_MUL OP_ELSE OP_SUB OP_ENDIF 11 22 OP_ENDIF'
// const test2 = '1 2 3 OP_IF OP_IF OP_IF 50 OP_ELSE 60 OP_ENDIF 77 88 OP_ELSE 0 OP_ADD OP_ENDIF OP_ENDIF 1'
// const test3 = '2 3 OP_ADD 5 OP_MUL'

// Script.fromString('0x0001 OP_IF 0x11 OP_ELSE 0xff OP_ENDIF').run()
// Script.fromString('1 1 OP_ADD').run()

// p2pk : '<pubkey> OP_CHECKSIG' + '<signature>'
// p2pkh : 'OP_DUP OP_HASH160 <hash> OP_EQUALVERIFY OP_CHECKSIG' + '<signature> <pubkey>'

class Script {
  constructor (_cmds = []) {
    this.cmds = _cmds
  }

  serialize () {
    const raw = recur(this.cmds)
    return nToVarint(raw.length).concat(raw)

    function recur ([head, ...tail]) {
      const bf = x => Buffer.from(x)

      if (isNil(head)) return bf([])
      if (isNumber(head)) return concat(bf([head]), recur(tail))
      return concatN(encodeLen(head.length), head, recur(tail))

      /*
       * number -> Buffer
       */
      function encodeLen (n) {
        const b76 = Buffer.from([76])
        const b77 = Buffer.from([77])
        return cond([
          [lt(__, 0x4c), nToLE(8)],
          [inRange(0x4c, 0x100), o(prefix(b76), nToLE(8))],
          [inRange(0x100, 520), o(prefix(b77), nToLE(16))],
        ])(n)
      }
    }
  }

  /*
   * @param { Script }
   * @return { Script }
   */
  add (that) {
    return new Script(this.cmds.concat(that.cmds))
  }

  run (config) {
    return interpreter(this.cmds, { verbose: true, ...config })
  }

  clone () {
    return new Script(R.clone(this.cmds))
  }

  /*
   * @param { Readable } : raw scriptPubkey or scriptSig byte stream
   * @return { Script } : a script whose cmds contains an array of parsed commands
   */
  static parse (stream) {
    return new Script([...bGenerator(stream)])

    function * bGenerator (s) {
      const readOp = _s => safeEval(() => _s.read(1).readUInt8())()

      for (let op = readOp(s); !isNil(op); op = readOp(s)) {
        if (op >= 1 && op <= 0x4b) yield s.read(op)
        if (op === 0x4c) yield s.read(s.read(1).readUInt8())
        if (op === 0x4d) yield s.read(s.read(2).readUInt16LE())
        if (op > 0x4d) yield op // type: number
      }
    }
  }

  /*
   * @param
   *    { String } : '1 1 OP_ADD'
   *    { Array } : ['1', '1', 'OP_ADD']
   * @return { Array } : [ <B 01>, <B 01>, 0x93 ]
   *
   */
  static fromString (_program) {
    const opcodes = require('./opcodes')
    const wordToCode = w => opcodes[w]
    const program = typeof _program === 'string'
      ? _program.split(' ')
      : _program
    const mapper = cond([
      [wordToCode, wordToCode], // XXX: omit OP_0
      [test(/^0x/), hexToBE],
      [T, o(nToLE(), Number)], // XXX: note the endianness
    ])
    return new Script(program.map(mapper))
  }

  static fromP2pkh (bHash160) {
    const hex = bHash160.toString('hex')
    return Script.fromString(`OP_DUP OP_HASH160 0x${hex} OP_EQUALVERIFY OP_CHECKSIG`)
  }

  static fromSigPk (bDER_, bSEC) {
    const hDER_ = bDER_.toString('hex')
    const hSEC = bSEC.toString('hex')
    return Script.fromString(`0x${hDER_} 0x${hSEC}`)
  }
}

module.exports = Script
