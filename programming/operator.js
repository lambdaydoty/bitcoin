const o = require('./opcodes')
const _b1 = Buffer.from([1])
const _b0 = Buffer.from([0])
const { hash256, sha1, hash160 } = require('../utils')

// NOTE: all numbers are stored in little-endian

/*
 * It is surprisingly easy and clear to use array destructions (a.k.a car/cdr)
 * instead of [].push(), [].pop()!
 *
 *  push x: s => [x, ...s]
 *  pop s: ([x, ...r]) => r
 */

module.exports = {
  [o.OP_SWAP]: ([x, y, ...rest]) => [y, x, ...rest],
  [o.OP_2DUP]: ([x, y, ...rest]) => [x, y, x, y, ...rest],
  [o.OP_DUP]: ([x, ...rest]) => [x, x, ...rest],

  [o.OP_EQUAL]: ([x, y, ...rest]) => [x.equals(y) ? _b1 : _b0, ...rest],
  [o.OP_NOT]: ([x, ...rest]) => [x.equals(_b0) ? _b1 : _b0, ...rest],

  [o.OP_ADD]: ([x, y, ...rest]) => [bufferArithmetic('add', x, y), ...rest],
  [o.OP_SUB]: ([x, y, ...rest]) => [bufferArithmetic('sub', x, y), ...rest],
  [o.OP_MUL]: ([x, y, ...rest]) => [bufferArithmetic('mul', x, y), ...rest],

  [o.OP_HASH256]: ([x, ...rest]) => [hash256(x), ...rest],
  [o.OP_HASH160]: ([x, ...rest]) => [hash160(x), ...rest],
  [o.OP_SHA1]: ([x, ...rest]) => [sha1(x), ...rest],

  [o.OP_CHECKSIG]: () => {},
  [o.OP_CHECKSIGVERIFY]: () => {},
  [o.OP_CHECKMULTISIG]: () => {},
  [o.OP_CHECKMULTISIGVERIFY]: () => {},
}

function bufferArithmetic (op, _x, _y) {
  const x = _x.toBN('le')
  const y = _y.toBN('le')
  return x[op](y).toBuffer('le')
}
