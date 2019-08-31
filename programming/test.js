/* eslint-env jest */

const point = require('./point')
const { hexToBE, nToBE, hash256 } = require('../utils')
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
  const { Secp256k1, O, G, N, bn } = require('./secp256k1')
  const { verify, sign } = require('./ecdsa')
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

  test.only('Exercise 6: verify', () => {
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
      z: hexTo256BE('ec208baa0fc1c19f708a9ca96fdeff3ac3f230bb4a7ba4aede4942ad003c0f60'),
      r: hexTo256BE('ac8d1c87e51d0d441be8b3dd5b05c8795b48875dffe00b7ffcfac23010d3a395'),
      s: hexTo256BE('68342ceff8935ededd102dd876ffd6ba72d6a427a3edb13d26eb0781cb423c4'),
    }

    const sig2 = {
      z: hexTo256BE('7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3d'),
      r: hexTo256BE('eff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2c'),
      s: hexTo256BE('c7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6'),
    }

    expect(verify(P, sig1.z, sig1.r, sig1.s)).toBe(true)
    expect(verify(P, sig2.z, sig2.r, sig2.s)).toBe(true)
  })

  test.only('Exercise 7: sign', () => {
    const e = nToBE(12345)
    const z = hash256(Buffer.from('Programming Bitcoin!'))
    const k = nToBE(1234567890)
    const { r, s, P } = sign(e, z, k)
    expect(r)
      .toEqual(hexToBE('2b698a0f0a4041b77e63488ad48c23e8e8838dd1fb7520408b121697b782ef22'))
    expect(s)
      .toEqual(hexToBE('1dbc63bfef4416705e602a7b564161167076d8b20990a0f26f316cff2cb0bc1a'))
    expect(P._x.toString(16))
      .toBe('f01d6b9018ab421dd410404cb869072065522bf85734008f105cf385a023a80f')
    expect(P._y.toString(16))
      .toBe('eba29d0f0c5408ed681984dc525982abefccd9f7ff01dd26da4999cf3f6a295')
  })
})
