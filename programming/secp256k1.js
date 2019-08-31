const point = require('./point')
const BN = require('bn.js')

const _2 = new BN(2)
const _32 = new BN(32)
const _256 = new BN(256)
const _977 = new BN(977)

const PRIME = _2.pow(_256).sub(_2.pow(_32)).sub(_977)
const ORDER = new BN('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16)
const red = BN.red(ORDER)
const gn = (...x) => new BN(...x).toRed(red)

class Secp256k1 extends point(0, 7, PRIME) {
  toCompress () {
    if (this.isId()) return null
    const even = Buffer.from([0x02])
    const odd = Buffer.from([0x03])
    const x = this._x.toBuffer('be', 32) // 256-bits
    const prefix = this._y.isEven() ? even : odd
    const compressed = Buffer.concat([prefix, x])
    return compressed
  }
}

const G = new Secp256k1(
  Secp256k1.bn('79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 16),
  Secp256k1.bn('483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8', 16),
)

const I = Secp256k1.id()

module.exports = {
  N: ORDER,
  P: PRIME,
  I,
  G,
  gn,
  bn: Secp256k1.bn,
  Secp256k1,
}
