const { toHex } = require('../utils')
const point = require('./point')
const BN = require('bn.js')

const _2 = new BN(2)
const _3 = new BN(3)
const _32 = new BN(32)
const _256 = new BN(256)
const _977 = new BN(977)

const PRIME = _2.pow(_256).sub(_2.pow(_32)).sub(_977)
const ORDER = new BN('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16)
const red = BN.red(ORDER)
const gn = (...x) => new BN(...x).toRed(red)

const SEC = {
  'even': Buffer.from([0x02]),
  'odd': Buffer.from([0x03]),
  'plain': Buffer.from([0x04]),
}

const Secp256k1 = point(0, 7, PRIME)

Secp256k1.prototype.toSEC = function (compressed = true) {
  if (this.isId()) return null
  const x = this._x.toBuffer('be', 32) // 256-bits
  const y = this._y.toBuffer('be', 32) // 256-bits
  if (compressed) {
    return Buffer.concat([
      this._y.isEven() ? SEC.even : SEC.odd,
      x,
    ])
  } else {
    return Buffer.concat([
      SEC.plain,
      x,
      y,
    ])
  }
}

Secp256k1.fromSEC = function (b) {
  const prefix = b.slice(0, 1)
  const _x = b.slice(1, 33)
  const _y = b.slice(33, 65)

  const r7 = Secp256k1.bn(7)

  const x = Secp256k1.bn(toHex(_x), 16)
  const y = prefix.equals(SEC.plain)
    ? Secp256k1.bn(toHex(_y), 16)
    : sqrt(x.redPow(_3).redAdd(r7), prefix) // y^2 = x^3 + 7

  return new Secp256k1(x, y)

  function sqrt (n, parity) {
    const r = n.redSqrt()
    const evenR = r.isEven() ? r : r.redNeg()
    const oddR = evenR.redNeg()
    return parity.equals(SEC.even)
      ? evenR
      : oddR
  }
}

const G = new Secp256k1(
  Secp256k1.bn('79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 16),
  Secp256k1.bn('483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8', 16),
)

const O = Secp256k1.id()

module.exports = {
  N: ORDER,
  P: PRIME,
  O,
  G,
  gn,
  bn: Secp256k1.bn,
  Secp256k1,
}
