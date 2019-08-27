const R = require('ramda')
const { T, cond, always, compose } = R
const _BN = require('bignumber.js')
const INF = new _BN('Infinity')

module.exports = (prime) => {
  class Field extends _BN {
    constructor (val) {
      super(new _BN(val).modulo(Field.prime))
    }

    add (y) { return new Field(this.plus(y).modulo(Field.prime)) }
    sub (y) { return new Field(this.minus(y).modulo(Field.prime)) }
    mul (y) { return new Field(this.times(y).modulo(Field.prime)) }

    exp (n) {
      if (typeof n !== 'number' && !(n instanceof _BN)) throw new Error(n)
      // return new Field(this.pow(n).modulo(Field.prime))
      const recur = m => cond([
        [isZero, always(new Field(1))],
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

    inv () { return this.exp(Field.prime.minus(2)) } // Fermat

    div (y) { return this.mul(y.inv()) }

    eq (y) { return this.isEqualTo(y) || this.sub(y).isEqualTo(0) }
    neq (y) { return !this.eq(y) }

    sqr () { return this.mul(this) }
    cub () { return this.mul(this).mul(this) }

    residue () {
      // return this // disable
      return this.isNegative()
        ? new Field(this.modulo(Field.prime).plus(Field.prime))
        : this
    }

    isFF () { return true }

    static sum (...operands) { return _BN.sum(...operands).modulo(Field.prime) }
  }

  Field.prime = new _BN(prime)
  Field.bn = x => new Field(x)
  Field.inf = INF

  return Field
}
