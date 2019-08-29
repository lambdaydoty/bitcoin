/* eslint-env jest */

const BN = require('bignumber.js')
const point = require('./point')
const bn = x => new BN(x)
const secp = require('tiny-secp256k1')

describe('Small curves', () => {
  // point(a, b, p): y^2 = x^3 + ax + b mod p
  const Point = point(0, 7, 223)
  const pt = (x, y) => new Point(x, y)
  const id = Point.identity()

  beforeAll(() => {
    expect.extend({ toBePoint: Point.toBePoint })
  })

  test('Exercise 1', () => {
    const expectOnCurve = (x, y) => {
      expect(() => pt(x, y)).not.toThrow()
    }
    const expectNotOnCurve = (x, y) => {
      expect(() => pt(x, y)).toThrow()
    }
    expectOnCurve(192, 105)
    expectOnCurve(17, 56)
    expectNotOnCurve(200, 119)
    expectOnCurve(1, 193)
    expectNotOnCurve(42, 99)
  })

  test('Exercise 2, 3', () => {
    expect(pt(170, 142).add(pt(60, 139))).toBePoint(pt(220, 181))
    expect(pt(47, 71).add(pt(17, 56))).toBePoint(pt(215, 68))
    expect(pt(143, 98).add(pt(76, 66))).toBePoint(pt(47, 71))
  })

  test('Exercise 4', () => {
    expect(pt(192, 105).rmul(2)).toBePoint(pt(49, 71))
    expect(pt(143, 98).rmul(2)).toBePoint(pt(64, 168))
    expect(pt(47, 71).rmul(2)).toBePoint(pt(36, 111))
    expect(pt(47, 71).rmul(4)).toBePoint(pt(194, 51))
    expect(pt(47, 71).rmul(8)).toBePoint(pt(116, 55))
    expect(pt(47, 71).rmul(21)).toBePoint(id)
  })

  test('Exercise 5', () => {
    const G = pt(15, 86)
    const I = id

    let i = null
    for (i = 1; G.rmul(i).neq(I); ++i) {}
    expect(i).toBe(7)
  })
})

describe('Bitcoin', () => {
  const two = bn(2)
  const prime = two.pow(256).minus(two.pow(32)).minus(977)
  const order = bn('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')
  const Secp256k1 = point(0, 7, prime, order)
  const id = Secp256k1.identity()
  const pt = (x, y) => new Secp256k1(x, y)

  const _x = bn('0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798')
  const _y = bn('0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8')
  const G = pt(_x, _y) // the generator

  beforeAll(() => {
    expect.extend({ toBePoint: Secp256k1.toBePoint })
  })

  test('Secp256k1', () => {
    const cG = G.toCompress()
    expect(G.rmul(order)).toBePoint(id)
    expect(G.rmul(0)).toBePoint(id)
    expect(G.rmul(1)).toBePoint(G)
    expect(cG).toEqual(hexTo256BE('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'))

    // const tweak = hexTo256BE('2')
    // const one = hexTo256BE('1')
    // console.log(`
    //   isPoint: ${secp.isPoint(cG)}
    //   isPointCompressed: ${secp.isPointCompressed(cG)}
    //   isPrivate(tweak): ${secp.isPrivate(tweak)}
    //   pointAdd(cG, cG):      ${secp.pointAdd(cG, cG).toString('hex')}
    //   pointAddScalar(cG, 1): ${secp.pointAddScalar(cG, one).toString('hex')}
    //   pointMultiply(cG, 2):  ${secp.pointMultiply(cG, tweak).toString('hex')}
    //   pointFromScalar(2):    ${secp.pointFromScalar(tweak).toString('hex')}
    //   privateAdd(2, 2):      ${secp.privateAdd(tweak, tweak).toString('hex')}
    // `)

    // const hex = 'ff0011'
    const hex = '3'
    const field = Secp256k1.bn(hex)
    const tw = hexTo256BE(hex)
    expect(G.rmul(field).toCompress()).toEqual(secp.pointFromScalar(tw))
  })

  function hexTo256BE (hex) {
    return Buffer.from(hex.padStart(64, '0'), 'hex')
  }

  test.only('Exercise 6', () => {
    // function der (r, s) {
    //   const sign = x => x[0] >= 0x80 ? Buffer.from([0x00]) : Buffer.from([])
    //   const start = Buffer.from([0x30])
    //   const marker = Buffer.from([0x02])
    //   const length = x => Buffer.from([x.length])
    //   const _r = Buffer.concat([sign(r), r])
    //   const _s = Buffer.concat([sign(s), s])
    //   const rs = Buffer.concat([
    //     marker,
    //     length(_r),
    //     _r,
    //     marker,
    //     length(_s),
    //     _s,
    //   ])
    //   return Buffer.concat([start, length(rs), rs])
    // }
    // der(
    //   Buffer.from(r.toString(16), 'hex'),
    //   Buffer.from(s.toString(16), 'hex'),
    // ),

    function verify (P, z, r, s) {
      expect(secp.verify(
        z.to256BE(),
        P.toCompress(),
        Buffer.concat([r.to256BE(), s.to256BE()]),
      )).toBe(true)

      const sInv = Secp256k1.bn(s.pow(order.minus(2), order))
      const u = Secp256k1.bn(z.times(sInv).modulo(order))
      const v = Secp256k1.bn(r.times(sInv).modulo(order))

      console.log(`
        O: ${order.toString(16)}
        P: ${prime.toString(16)}
        z: ${z.toString(16)}
        r: ${r.toString(16)}
        si: ${sInv.toString(16)}
        u: ${u.toString(16)}
        v: ${v.toString(16)}
      `)

      const uG = G.rmul(u)
      const vP = P.rmul(v)
      const SUM = uG.add(vP)
      const { _x } = SUM
      return _x.eq(r)
    }

    const P = pt(
      bn('0x887387e452b8eacc4acfde10d9aaf7f6d9a0f975aabb10d006e4da568744d06c'),
      bn('0x61de6d95231cd89026e286df3b6ae4a894a3378e393e93a0f45b666329a0ae34'),
    )
    const z = Secp256k1.bn('0xec208baa0fc1c19f708a9ca96fdeff3ac3f230bb4a7ba4aede4942ad003c0f60')
    const r = Secp256k1.bn('0xac8d1c87e51d0d441be8b3dd5b05c8795b48875dffe00b7ffcfac23010d3a395')
    const s = Secp256k1.bn('0x68342ceff8935ededd102dd876ffd6ba72d6a427a3edb13d26eb0781cb423c4')

    // const z = Secp256k1.bn('0x7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3d')
    // const r = Secp256k1.bn('0xeff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2c')
    // const s = Secp256k1.bn('0xc7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6')

    // const z = Secp256k1.bn('0x0')
    // const r = Secp256k1.bn('0x37206a0610995c58074999cb9767b87af4c4978db68c06e8e6e81d282047a7c6')
    // const s = Secp256k1.bn('0x8ca63759c1157ebeaec0d03cecca119fc9a75bf8e6d0fa65c841c8e2738cdaec')

    // verify(P, z, r, s)
    expect(verify(P, z, r, s)).toBe(true)
  })
})
