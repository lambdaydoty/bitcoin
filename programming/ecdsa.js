const assert = require('assert')
const crypto = require('crypto')
const { G, Secp256k1, gn } = require('./secp256k1')
const { toHex, bToStream } = require('../utils')

module.exports = { verify, sign, toDER, fromDER }

function verify (
  P, /* Point: public key */
  _z, /* Buffer: message */
  _r, /* Buffer */
  _s, /* Buffer */
  // _der, /* Buffer */
) {
  assert.strictEqual(P instanceof Secp256k1, true)
  assert.strictEqual(Buffer.isBuffer(_z), true)
  assert.strictEqual(Buffer.isBuffer(_r), true)
  assert.strictEqual(Buffer.isBuffer(_s), true)
  assert.strictEqual(_z.length, 256 / 8)
  assert.strictEqual(_r.length, 256 / 8)
  assert.strictEqual(_s.length, 256 / 8)

  const z = gn(toHex(_z), 16)
  const r = gn(toHex(_r), 16)
  const s = gn(toHex(_s), 16)

  const sInv = s.redInvm()
  const u = z.redMul(sInv)
  const v = r.redMul(sInv)

  const uG = G.rmul(u.fromRed())
  const vP = P.rmul(v.fromRed())
  const SUM = uG.add(vP)
  const { _x } = SUM
  return _x.eq(r) // XXX: check _x vs r
}

/*
 * @param {Buffer} : _e - the private key
 * @param {Buffer} : _z - the message to be signed
 * @return {Object} :
 *   {Buffer} : r - the r value
 *   {Buffer} : s - the LOWER s value
 *   {Lambda} : toDER - convert (r, s) to DER format
 *   {Point} : P - the public key correspondig to _e
 *
 * @!Note: sign() will produce different (r, s) at different calls!
 *
 */
function sign (
  _e, /* Buffer: private key */
  _z, /* Buffer: message */
  _k = null,
) {
  assert.strictEqual(Buffer.isBuffer(_e), true)
  assert.strictEqual(Buffer.isBuffer(_z), true)
  assert.strictEqual(_e.length, 256 / 8)
  assert.strictEqual(_z.length, 256 / 8)

  const e = gn(toHex(_e), 16)
  const z = gn(toHex(_z), 16)
  const k = gn(toHex(_k || crypto.randomBytes(256)), 16)

  const kInv = k.redInvm()
  const { _x } = G.rmul(k.fromRed())

  const r = gn(_x.fromRed())
  const _s = e.redMul(r).redAdd(z).redMul(kInv)
  const ns = _s.redNeg()
  const s = _s.fromRed().gt(ns.fromRed()) ? ns : _s

  const P = G.rmul(e.fromRed())

  return ({
    r: r.toBuffer('be', 256 / 8),
    s: s.toBuffer('be', 256 / 8),
    P,
    toDER,
  })
}

const START = Buffer.from([0x30])
const INTEGER = Buffer.from([0x02])

function toDER (_r, _s) {
  const r = this.r || _r
  const s = this.s || _s

  assert.ok(Buffer.isBuffer(r) && r.length === 32)
  assert.ok(Buffer.isBuffer(s) && s.length === 32)

  const sign = x => x[0] >= 0x80 ? Buffer.from([0x00]) : Buffer.from([])
  const length = x => Buffer.from([x.length]) // NOTE: up to 73/74 bytes
  const signedR = Buffer.concat([sign(r), r])
  const signedS = Buffer.concat([sign(s), s])
  const rs = Buffer.concat([
    INTEGER, length(signedR), signedR,
    INTEGER, length(signedS), signedS,
  ])
  return Buffer.concat([
    START, length(rs), rs,
  ])
}

function fromDER (b) {
  return [...bGenerator(bToStream(b))]
  function * bGenerator (stream) {
    const readChunk = marker => (s) => {
      const m = s.read(1)
      assert.ok(m.equals(marker))

      const length = s.read(1).readUInt8()
      const chunk = s.read(length)
      return chunk
    }

    const rs = readChunk(START)(stream)
    const subStream = bToStream(rs)

    const R = readChunk(INTEGER)(subStream)
    const S = readChunk(INTEGER)(subStream)

    const removeSign = b => b[0] ? b : b.slice(1)

    yield removeSign(R)
    yield removeSign(S)
  }
}
