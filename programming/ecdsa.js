const assert = require('assert')
module.exports = { verify, sign }

const BN = require('bn.js')
const { G, Secp256k1 } = require('./secp256k1')

function verify ({
  P,
  z,
  r,
  s,
}) {
  assert.strictEqual(P instanceof Secp256k1, true)
  assert.strictEqual(z instanceof BN, true)
  assert.strictEqual(r instanceof BN, true)
  assert.strictEqual(s instanceof BN, true)

  const sInv = s.redInvm()
  const u = z.redMul(sInv)
  const v = r.redMul(sInv)

  const uG = G.rmul(u.fromRed())
  const vP = P.rmul(v.fromRed())
  const SUM = uG.add(vP)
  const { _x } = SUM
  return _x.eq(r) // XXX: check _x vs r
}

function sign () {
}
