/* eslint-env jest */

const point = require('./point')
const { hexToBE } = require('../utils')
const hexTo256BE = h => hexToBE(h, 256)

describe('Small curves', () => {
  // point(a, b, p): y^2 = x^3 + ax + b mod p
  const Point = point(0, 7, 223)
  const pt = (x, y) => new Point(x, y)
  const id = Point.id()

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
    expect(id.eq(id)).toBe(true)
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
    const O = id

    let i = null
    for (i = 1; G.rmul(i).neq(O); ++i) {}
    expect(i).toBe(7)
  })
})

describe('Bitcoin', () => {
  const { Secp256k1, O, G, N, bn, gn } = require('./secp256k1')
  const { verify } = require('./ecdsa')
  const pt = (x, y) => new Secp256k1(x, y)

  beforeAll(() => {
    expect.extend({ toBePoint: Secp256k1.toBePoint })
  })

  test('Secp256k1', () => {
    expect(G.rmul(N)).toBePoint(O)
    expect(G.rmul(0)).toBePoint(O)
    expect(G.rmul(1)).toBePoint(G)
    expect(G.toCompress()).toEqual(hexTo256BE('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'))
  })

  test('Exercise 6', () => {
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

    const P = pt(
      bn('887387e452b8eacc4acfde10d9aaf7f6d9a0f975aabb10d006e4da568744d06c', 16),
      bn('61de6d95231cd89026e286df3b6ae4a894a3378e393e93a0f45b666329a0ae34', 16),
    )

    const sig1 = {
      z: gn('ec208baa0fc1c19f708a9ca96fdeff3ac3f230bb4a7ba4aede4942ad003c0f60', 16),
      s: gn('68342ceff8935ededd102dd876ffd6ba72d6a427a3edb13d26eb0781cb423c4', 16),
      r: gn('ac8d1c87e51d0d441be8b3dd5b05c8795b48875dffe00b7ffcfac23010d3a395', 16),
    }

    const sig2 = {
      z: gn('7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3d', 16),
      s: gn('c7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6', 16),
      r: gn('eff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2c', 16),
    }

    // verify(P, z, r, s)
    expect(verify({ P, ...sig1 })).toBe(true)
    expect(verify({ P, ...sig2 })).toBe(true)
  })
})
