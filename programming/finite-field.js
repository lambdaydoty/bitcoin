const R = require('ramda')
const { T, cond, always, compose } = R
const _BN = require('bignumber.js')
const INF = new _BN('Infinity')

module.exports = (prime) => {
  class Self extends _BN {
    add (y) { return new Self(this.plus(y).modulo(Self.prime)) }
    sub (y) { return new Self(this.minus(y).modulo(Self.prime)) }
    mul (y) { return new Self(this.times(y).modulo(Self.prime)) }

    exp (n) {
      if (typeof n !== 'number' && !(n instanceof _BN)) throw new Error(n)
      // return new Self(this.pow(n).modulo(Self.prime))
      const recur = m => cond([
        [isZero, always(new Self(1))],
        [isEven, compose(square, recur, half)],
        [T, compose(lmul(this), recur, sub1)],
      ])(m)

      // return recur(n)
      return R.memoizeWith(x => x.toString(), recur)(n)

      function isZero (m) { return m.isZero() }
      function isEven (m) { return m.modulo(2).isZero() }
      function half (m) { return m.dividedBy(2) }
      function sub1 (m) { return m.minus(1) }

      function square (y) { return y.sqr() }
      function lmul (unit) {
        return function (right) {
          return right.mul(unit)
        }
      }
    }

    inv () { return this.exp(Self.prime.minus(2)) } // Fermat

    div (y) { return this.mul(y.inv()) }

    eq (y) { return this.isEqualTo(y) || this.sub(y).isEqualTo(0) }
    neq (y) { return !this.eq(y) }

    sqr () { return this.mul(this) }
    cub () { return this.mul(this).mul(this) }

    residue () {
      return this // disable
      // return this.isNegative()
      //   ? this.modulo(BN._BASE).plus(BN._BASE)
      //   : this
    }

    static sum (...operands) { return _BN.sum(...operands).modulo(Self.prime) }
  }

  Self.prime = new _BN(prime)
  Self.bn = x => new Self(x)
  Self.inf = INF

  return Self
}
