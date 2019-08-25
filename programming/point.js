const R = require('ramda')
const { T, cond, always, compose } = R
const { bn } = require('./finite-field')
const { INF, setBase } = bn

const point = (a, b, p) => class Self {
  constructor (x, y) {
    setBase(p)
    if (!compatible(x, y, a, b)) throw new Error({ x, y, a, b })
    this._x = bn(x).residue()
    this._y = bn(y).residue()
    function compatible (x, y, a, b) {
      if (x.isEqualTo && x.isEqualTo(INF) &&
        y.isEqualTo && y.isEqualTo(INF)) return true
      // y^2 = x^3 + ax + b
      return bn(y).sqr().eq(bn.sum(
        bn(x).cub(),
        bn(a).mul(x),
        bn(b),
      ))
    }
  }

  eq (that) { return this._x.eq(that._x) && this._y.eq(that._y) }

  neq (that) { return !this.eq(that) }

  toString () { return `(${this._x.toString()}, ${this._y.toString()})` }

  isInf () { return this._x.isEqualTo(INF) && this._y.isEqualTo(INF) }

  add (that) {
    if (this.isInf()) return new Self(that._x, that._y)
    if (that.isInf()) return new Self(this._x, this._y)
    if (this._x.eq(that._x) && this._y.neq(that._y)) return new Self(INF, INF) // P + (-P)
    const s = slope(this, that)
    const x = s.sqr().sub(this._x).sub(that._x)
    const y = s.mul(this._x.sub(x)).sub(this._y)
    return new Self(x, y) // XXX: check Self(INF, INF)
    function slope (p, q) {
      const { _x: x1, _y: y1 } = p
      const { _x: x2, _y: y2 } = q
      const dy = y2.sub(y1)
      const dx = x2.sub(x1)
      return dx.neq(0)
        ? dy.div(dx) // secant line
        : x1.sqr().mul(3).add(a).div(y1.mul(2)) // tangent line (possible INF)
    }
  }

  // TODO https://github.com/jimmysong/programmingbitcoin/blob/master/code-ch03/answers.py
  rmul (n) {
    if (typeof n !== 'number') throw new Error(n)

    const recur = m => cond([
      [isZero, always(new Self(INF, INF))],
      [isEven, compose(double, recur, half)],
      [T, compose(inc(this), recur, sub1)],
    ])(m)

    // return recur(n)
    return R.memoizeWith(R.identity, recur)(n)

    function isZero (m) { return m === 0 }
    function isEven (m) { return m % 2 === 0 }
    function half (m) { return m / 2 }
    function sub1 (m) { return m - 1 }
    function double (point) { return point.add(point) }
    function inc (unit) {
      return function (point) {
        return point.add(unit)
      }
    }
  }

  static inf () { return new Self(INF, INF) }

  static toBePoint (received, expected) {
    const pass = received instanceof Self &&
      received.eq(expected)
    const passMessage = () => `expected ${received} not to be Point (${expected})`
    const notPassMessage = () => `expected ${received} to be Point (${expected})`
    return {
      pass,
      message: pass ? passMessage : notPassMessage,
    }
  }
}

module.exports = { point }
