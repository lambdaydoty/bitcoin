const R = require('ramda')
const { T, cond, compose } = R
const ff = require('./finite-field')

module.exports = (a, b, p, order = null) => {
  const BN = ff(p)
  const { inf } = BN
  const bn = x => new BN(x)

  class Self {
    constructor (x, y) {
      if (x.isEqualTo && x.isEqualTo(inf) &&
        y.isEqualTo && y.isEqualTo(inf)) {
        this._x = x
        this._y = y
      } else {
        if (!compatible(x, y, a, b)) throw new Error({ x, y, a, b })
        this._x = bn(x).residue()
        this._y = bn(y).residue()
        if (!this._x.isFF() || !this._y.isFF()) throw new Error(`${this._x} ${this._y}`)
      }

      function compatible (x, y, a, b) {
        // console.log(`a: ${a.toString()}`)
        // console.log(`b: ${b.toString()}`)
        // console.log(`p: ${p.toString()}`)
        // console.log(`x: ${x.toString()}`)
        // console.log(`y: ${y.toString()}`)
        // y^2 = x^3 + ax + b
        return bn(y).sqr().eq(BN.sum(
          bn(x).cub(),
          bn(a).mul(x),
          bn(b),
        ))
      }
    }

    toString () { return `(${this._x.toString()}, ${this._y.toString()})` }
    toCompress () {
      const even = Buffer.from([0x02])
      const odd = Buffer.from([0x03])
      const x = Buffer.from(this._x.toString(16).padStart(64, '0'), 'hex')
      const prefix = this._y.modulo(2).isEqualTo(0) ? even : odd
      const compressed = Buffer.concat([prefix, x])
      return compressed
    }

    eq (that) { return this._x.eq(that._x) && this._y.eq(that._y) }
    neq (that) { return !this.eq(that) }

    isId () { return this._x.isEqualTo(inf) && this._y.isEqualTo(inf) }

    add (that) {
      if (this.isId()) return new Self(that._x, that._y)
      if (that.isId()) return new Self(this._x, this._y)
      if (this._x.eq(that._x) && this._y.neq(that._y)) return new Self(inf, inf) // P + (-P)

      const s = slope(this, that)
      const x = s.sqr().sub(this._x).sub(that._x)
      const y = s.mul(this._x.sub(x)).sub(this._y)
      return new Self(x, y) // XXX: check Self(inf, inf)

      function slope (p, q) {
        const { _x: x1, _y: y1 } = p
        const { _x: x2, _y: y2 } = q
        const dy = y2.sub(y1)
        const dx = x2.sub(x1)
        return dx.neq(0)
          ? dy.div(dx) // secant line
          : x1.sqr().mul(3).add(a).div(y1.mul(2)) // tangent line (possible inf)
      }
    }

    rmul (_n) {
      const n = Self.order
        ? bn(_n).modulo(Self.order) // modulo Group order if provided!
        : bn(_n)

      // console.log(`@rmul ${_n.toString()}`)

      const recur = m => cond([
        [isZero, id],
        [isEven, compose(double, recur, half)],
        [T, compose(inc(this), recur, sub1)],
      ])(m)
      // ])(R.tap(console.log)(m))

      // return recur(n)
      return R.memoizeWith(x => x.toString(), recur)(n)

      function isZero (m) { return m.isZero() }
      function isEven (m) { return m.modulo(2).isZero() }
      function half (m) {
        // console.log(`halfing: ${m.toString()}`)
        return m.dividedBy(2)
      }

      function sub1 (m) {
        // console.log(`sub1ing: ${m.toString()}`)
        return m.minus(1)
      }

      function id () {
        // console.log(`@id`)
        return new Self(inf, inf)
      }

      function double (point) {
        // console.log(`@double`)
        // console.log(point.toString())
        return point.add(point)
      }
      function inc (unit) {
        return function (point) {
          // console.log(`@inc`)
          // console.log(unit.toString())
          // console.log(point.toString())
          return point.add(unit)
        }
      }
    }

    static identity () { return new Self(inf, inf) }

    static bn (x) { return bn(x) }

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

  Self.order = order

  return Self
}
