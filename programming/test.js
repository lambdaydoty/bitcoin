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
    expect(G.toSEC()).toEqual(hexToBE('0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798'))
  })

  test('Exercise 6: verify', () => {
    // function der (r, s) {
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

  test('Exercise 7: sign', () => {
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

describe('Serialization', () => {
  const { toDER } = require('./ecdsa')
  const { Secp256k1, G, gn } = require('./secp256k1')
  const BN = require('bn.js')
  const _5 = new BN(5)

  beforeAll(() => {
    expect.extend({ toBePoint: Secp256k1.toBePoint })
  })

  test('Exercise 1', () => {
    const priv1 = 5000
    const priv2 = gn(2018).redPow(_5)
    const priv3 = gn('deadbeef12345', 16)
    expect(G.rmul(priv1).toSEC(false)).toEqual(Buffer.from(
      '04ffe558e388852f0120e46af2d1b370f85854a8eb0841811ece0e3e03d282d57c315dc72890a4f10a1481c031b03b351b0dc79901ca18a00cf009dbdb157a1d10',
      'hex',
    ))
    expect(G.rmul(priv2).toSEC(false)).toEqual(Buffer.from(
      '04027f3da1918455e03c46f659266a1bb5204e959db7364d2f473bdf8f0a13cc9dff87647fd023c13b4a4994f17691895806e1b40b57f4fd22581a4f46851f3b06',
      'hex',
    ))
    expect(G.rmul(priv3).toSEC(false)).toEqual(Buffer.from(
      '04d90cd625ee87dd38656dd95cf79f65f60f7273b67d3096e68bd81e4f5342691f842efa762fd59961d0e99803c61edba8b3e3f7dc3a341836f97733aebf987121',
      'hex',
    ))
  })

  test('Exercise 2', () => {
    const priv1 = 5001
    const priv2 = gn(2019).redPow(_5)
    const priv3 = gn('deadbeef54321', 16)
    const cP1 = Buffer.from('0357a4f368868a8a6d572991e484e664810ff14c05c0fa023275251151fe0e53d1', 'hex')
    const cP2 = Buffer.from('02933ec2d2b111b92737ec12f1c5d20f3233a0ad21cd8b36d0bca7a0cfa5cb8701', 'hex')
    const cP3 = Buffer.from('0296be5b1292f6c856b3c5654e886fc13511462059089cdf9c479623bfcbe77690', 'hex')
    expect(G.rmul(priv1).toSEC()).toEqual(cP1)
    expect(G.rmul(priv2).toSEC()).toEqual(cP2)
    expect(G.rmul(priv3).toSEC()).toEqual(cP3)
    expect(Secp256k1.fromSEC(cP1)).toBePoint(G.rmul(priv1))
    expect(Secp256k1.fromSEC(cP2)).toBePoint(G.rmul(priv2))
    expect(Secp256k1.fromSEC(cP3)).toBePoint(G.rmul(priv3))
  })

  test('Exercise 3', () => {
    expect(toDER(
      hexTo256BE('37206a0610995c58074999cb9767b87af4c4978db68c06e8e6e81d282047a7c6'),
      hexTo256BE('8ca63759c1157ebeaec0d03cecca119fc9a75bf8e6d0fa65c841c8e2738cdaec'),
    )).toEqual(Buffer.from('3045022037206a0610995c58074999cb9767b87af4c4978db68c06e8e6e81d282047a7c60221008ca63759c1157ebeaec0d03cecca119fc9a75bf8e6d0fa65c841c8e2738cdaec',
      'hex',
    ))
  })

  test.only('Exercise 5', () => {
    const base58check = require('./base58check')
    const { hash160 } = require('../utils')

    console.log({ hash160 })

    const MAINNET = Buffer.from([0x00])
    const TESTNET = Buffer.from([0x6f])

    Buffer.prototype.toBs58ck = function (prefix) { return base58check(prefix, this) }
    Buffer.prototype.toHash160 = function () { return hash160(this) }

    const priv1 = 5002
    const priv2 = gn(2020).redPow(_5)
    const priv3 = gn('12345deadbeef', 16)

    expect(G
      .rmul(priv1) // to public key
      .toSEC(false) // to uncompressed public key
      .toHash160() // to uncompressed public key hash
      .toBs58ck(TESTNET) // to address
    ).toBe('mmTPbXQFxboEtNRkwfh6K51jvdtHLxGeMA')
    expect(G
      .rmul(priv2)
      .toSEC()
      .toHash160()
      .toBs58ck(TESTNET)
    ).toBe('mopVkxp8UhXqRYbCYJsbeE1h1fiF64jcoH')
    expect(G
      .rmul(priv3)
      .toSEC()
      .toHash160()
      .toBs58ck(MAINNET)
    ).toBe('1F1Pn2y6pDb68E5nYJJeba4TLg2U7B6KF1')
  })
})
