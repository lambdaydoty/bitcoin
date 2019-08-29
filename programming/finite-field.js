const R = require('ramda')
const { T, cond, always, compose } = R
const BN = require('bignumber.js')

module.exports = (prime) => {
  class Field extends BN {
    constructor (val) {
      super(new BN(val).modulo(Field.prime))
    }

    to256BE () { return Buffer.from(this.toString(16).padStart(64, '0'), 'hex') }

    add (y) { return new Field(this.plus(y).modulo(Field.prime)) }
    sub (y) { return new Field(this.minus(y).modulo(Field.prime)) }
    mul (y) { return new Field(this.times(y).modulo(Field.prime)) }
    half (y) { return new Field(this.dividedBy(2)) }
    sub1 () { return this.sub(1) }

    exp (n) {
      if (typeof n !== 'number' && !(n instanceof BN)) throw new Error(n)
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

    static sum (...operands) { return BN.sum(...operands).modulo(Field.prime) }

    static toBeField (received, expected) {
      const pass = received instanceof Field &&
        received.eq(expected)
      const passMessage = () => `expected ${received} not to be Field (${expected})`
      const notPassMessage = () => `expected ${received} to be Field (${expected})`
      return {
        pass,
        message: pass ? passMessage : notPassMessage,
      }
    }
  }

  Field.prime = new BN(prime)
  Field.inf = new BN('Infinity')
  Field.bn = x => new Field(x)

  return Field
}
