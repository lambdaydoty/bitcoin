const R = require('ramda')
const { T, cond, compose } = R
const { pipe, always } = R
const { unless } = R
const BN = require('bn.js')

module.exports = (_a, _b, _p) => {
  const _1 = new BN(1)
  const _2 = new BN(2)
  const _3 = new BN(3)
  const PRIME = new BN(_p)
  const red = BN.red(PRIME)
  const bn = (...x) => new BN(...x).toRed(red)
  const a = bn(_a)
  const b = bn(_b)
  const r0 = bn(0)
  const r2 = bn(2)
  const r3 = bn(3)
  const sum = (...args) => args.reduce(
    (acc, curr) => acc.redAdd(curr),
    r0,
  )

  // const ORDER = order ? new BN(order) : null

  class Self {
    constructor (_x, _y) {
      if (!_x && !_y) {
        // identity
        this._x = this._y = null
      } else if (_x && _y) {
        const bnIfNeed = unless(BN.isBN, bn)
        const x = bnIfNeed(_x)
        const y = bnIfNeed(_y)
        if (!compatible(x, y, a, b)) throw new Error({ x, y, a, b })
        this._x = x
        this._y = y
      } else {
        throw new Error({ _x, _y })
      }

      function compatible (x, y, a, b) {
        // console.log({ x, y, a, b })
        // y^2 = x^3 + ax + b
        return y.redSqr().eq(sum(
          x.redPow(_3),
          a.redMul(x),
          b,
        ))
      }
    }

    toString () { return this.isId() ? 'O' : `(${this._x.toString(16)}, ${this._y.toString(16)})` }

    isId () { return !this._x && !this._y }

    eq (that) {
      if (this.isId() && that.isId()) return true
      if (this.isId() || that.isId()) return false
      return this._x.eq(that._x) && this._y.eq(that._y)
    }

    neq (that) { return !this.eq(that) }

    add (that) {
      if (this.isId()) return new Self(that._x, that._y)
      if (that.isId()) return new Self(this._x, this._y)
      if (this._x.eq(that._x) && !this._y.eq(that._y)) return Self.id() // P + (-P)

      const s = slope(this, that)
      const x = s.redSqr().redSub(this._x).redSub(that._x)
      const y = s.redMul(this._x.redSub(x)).redSub(this._y)
      return new Self(x, y)

      function slope (p, q) {
        const { _x: x1, _y: y1 } = p
        const { _x: x2, _y: y2 } = q
        const dy = y2.redSub(y1)
        const dx = x2.redSub(x1)
        return !dx.eq(r0)
          ? dy.redMul(dx.redInvm()) // secant line
          : x1.redSqr().redMul(r3).redAdd(a).redMul(y1.redMul(r2).redInvm())
        // tangent line (possible inf) // TODO inf
      }
    }

    rmul (/* Zn of order order */ _n) {
      const n = new BN(_n)

      const recur = m => pipe(
        always(m),
        // R.tap(x => console.log(x.toString())),
        cond([
          [isZero, id],
          [isEven, compose(double, recur, half)],
          [T, compose(inc(this), recur, sub1)],
        ]),
        // R.tap(check(this, m)),
      )()

      return recur(n)
      // return R.memoizeWith(x => x.toString(), recur)(n)

      function isZero (m) { return m.isZero() }
      function isEven (m) { return m.isEven() }

      function half (m) { return m.div(_2) }
      function sub1 (m) { return m.sub(_1) }

      function id () { return Self.id() }
      function double (point) { return point.add(point) }
      function inc (unit) { return point => point.add(unit) }

      // function check (pt, m) {
      //   return function (answer) {
      //     const secp = require('tiny-secp256k1')
      //     const solution = secp.pointMultiply(pt.toCompress(), m.to256BE())
      //     if (!answer.toCompress() && !solution) return
      //     // console.log(`
      //     //   answer:   ${answer.toCompress().toString('hex')}
      //     //   solution: ${solution.toString('hex')}
      //     // `)
      //     if (!answer.toCompress().equals(solution)) {
      //       console.log(`
      //       point: ${pt.toString()}
      //       m: ${m.toString()}
      //       answer:   ${answer.toString()}
      //       solution: ${solution.toString('hex')}
      //       `)
      //       throw new Error()
      //     }
      //   }
      // }
    }

    static id () { return new Self() }

    static bn (...x) { return bn(...x) }

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

  // Self.order = order

  return Self
}
