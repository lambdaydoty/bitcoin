const BN = require('bignumber.js')
const { bn } = require('../utils')

bn.setBase = b => { BN._BASE = bn(b) }
bn.sum = (...operands) => BN.sum(...operands).modulo(BN._BASE)
bn.INF = bn('Infinity')
BN.prototype = { ...BN.prototype,

  add (y) { return this.plus(y).modulo(BN._BASE) },
  sub (y) { return this.minus(y).modulo(BN._BASE) },
  mul (y) { return this.times(y).modulo(BN._BASE) },
  exp (y) { return this.pow(y).modulo(BN._BASE) },
  inv () { return this.exp(BN._BASE - 2) }, // Fermat
  div (y) { return this.mul(bn(y).inv()) },

  eq (y) { return this.isEqualTo(y) || this.minus(y).modulo(BN._BASE).isEqualTo(0) },
  neq (y) { return !this.eq(y) },

  sqr () { return this.exp(2) },
  cub () { return this.exp(3) },

  residue () {
    return this // mock
    // return this.isNegative()
    //   ? this.modulo(BN._BASE).plus(BN._BASE)
    //   : this
  },

}

module.exports = { bn }
