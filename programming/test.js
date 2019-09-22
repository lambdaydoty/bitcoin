/* eslint-env jest */

const point = require('./point')
const { bn, toBeBN, bToStream, hexToBE, nToBE, hash256 } = require('../utils')
const hexTo256BE = h => hexToBE(h, 256)

expect.extend({ toBeBN })

describe('Small curves', () => {
  // point(a, b, p): y^2 = x^3 + ax + b mod p
  const Point = point(0, 7, bn(223))
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
    //   hexToBE(r.toString(16)),
    //   hexToBE(s.toString(16)),
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
    const e = nToBE(256)(12345)
    const z = hash256(Buffer.from('Programming Bitcoin!'))
    const k = nToBE(256)(1234567890)
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
  const { fromDER, toDER } = require('./ecdsa')
  const { Secp256k1, G, gn } = require('./secp256k1')
  const _5 = bn(5)

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
    const cP1 = hexToBE('0357a4f368868a8a6d572991e484e664810ff14c05c0fa023275251151fe0e53d1')
    const cP2 = hexToBE('02933ec2d2b111b92737ec12f1c5d20f3233a0ad21cd8b36d0bca7a0cfa5cb8701')
    const cP3 = hexToBE('0296be5b1292f6c856b3c5654e886fc13511462059089cdf9c479623bfcbe77690')
    expect(G.rmul(priv1).toSEC()).toEqual(cP1)
    expect(G.rmul(priv2).toSEC()).toEqual(cP2)
    expect(G.rmul(priv3).toSEC()).toEqual(cP3)
    expect(Secp256k1.fromSEC(cP1)).toBePoint(G.rmul(priv1))
    expect(Secp256k1.fromSEC(cP2)).toBePoint(G.rmul(priv2))
    expect(Secp256k1.fromSEC(cP3)).toBePoint(G.rmul(priv3))
  })

  test('Exercise 3', () => {
    const [R, S] = [
      hexTo256BE('37206a0610995c58074999cb9767b87af4c4978db68c06e8e6e81d282047a7c6'),
      hexTo256BE('8ca63759c1157ebeaec0d03cecca119fc9a75bf8e6d0fa65c841c8e2738cdaec'),
    ]
    const der = hexToBE('3045022037206a0610995c58074999cb9767b87af4c4978db68c06e8e6e81d282047a7c60221008ca63759c1157ebeaec0d03cecca119fc9a75bf8e6d0fa65c841c8e2738cdaec')

    expect(toDER(R, S)).toEqual(der)
    expect(fromDER(der)).toEqual([R, S])
  })

  test('Exercise 4', () => {
    const bs58 = require('bs58')
    const b = hexToBE('eff69ef2b1bd93a66ed5219add4fb51e11a840f404876325a1e8ffe0529a2c')
    expect(bs58.encode(hexToBE('7c076ff316692a3d7eb3c3bb0f8b1488cf72e1afcd929e29307032997a838a3d'))).toBe('9MA8fRQrT4u8Zj8ZRd6MAiiyaxb2Y1CMpvVkHQu5hVM6')
    expect(bs58.encode(b)).toBe('4fE3H2E6XMp4SsxtwinF7w9a34ooUrwWe4WsW1458Pd')
    expect(bs58.encode(hexToBE('c7207fee197d27c618aea621406f6bf5ef6fca38681d82b2f06fddbdce6feab6'))).toBe('EQJsjkd6JaGwxrjEhfeqPenqHwrBmPQZjJGNSCHBkcF7')
  })

  test('Exercise 5', () => {
    const { hash160 } = require('../utils')
    const { toBs58Check } = require('./addressCodec')

    Buffer.prototype.toBs58Check = function (type) { return toBs58Check(type, this) }
    Buffer.prototype.toHash160 = function () { return hash160(this) }

    const priv1 = 5002
    const priv2 = gn(2020).redPow(_5)
    const priv3 = gn('12345deadbeef', 16)

    expect(G
      .rmul(priv1) // to public key
      .toSEC(false) // to uncompressed public key
      .toHash160() // to uncompressed public key hash
      .toBs58Check('tp2pkh') // to address
    ).toBe('mmTPbXQFxboEtNRkwfh6K51jvdtHLxGeMA')
    expect(G
      .rmul(priv2)
      .toSEC()
      .toHash160()
      .toBs58Check('tp2pkh')
    ).toBe('mopVkxp8UhXqRYbCYJsbeE1h1fiF64jcoH')
    expect(G
      .rmul(priv3)
      .toSEC()
      .toHash160()
      .toBs58Check('p2pkh')
    ).toBe('1F1Pn2y6pDb68E5nYJJeba4TLg2U7B6KF1')
  })

  test('Exercise 6', () => {
    const { toBs58Check } = require('./addressCodec')

    Buffer.prototype.toBs58Check = function (type) { return toBs58Check(type, this) }

    const priv1 = gn(5003)
    const priv2 = gn(2021).redPow(_5)
    const priv3 = gn('54321deadbeef', 16)

    expect(priv1
      .toBuffer('be', 256 / 8)
      .toBs58Check('tcWIF')
    ).toBe('cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN8rFTv2sfUK')

    expect(priv2
      .toBuffer('be', 256 / 8)
      .toBs58Check('tuWIF')
    ).toBe('91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjpWAxgzczjbCwxic')

    expect(priv3.toBuffer('be', 256 / 8)
      .toBs58Check('cWIF')
    ).toBe('KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgiuQJv1h8Ytr2S53a')
  })
})

describe('Transaction', () => {
  const Transaction = require('./Transaction')
  const { bToStream } = require('../utils')

  beforeAll(() => {
    // expect.extend({ toBePoint: Secp256k1.toBePoint })
  })

  test('Exercise 1', () => {
    // hexTrxs[0]: https://chain.so/tx/BTC/452c629d67e41baec3ac6f04fe744b4b9617f8f859c63b3002f8684e7a4fee03
    const hexTrxs = require('./trxs')
    const stream = bToStream(hexToBE(hexTrxs[0]))
    const trx = Transaction.parse(stream)
    console.log(`${trx}`)

    // const { parseVarintToBN, nToVarint } = Transaction

    // const varInt1 = hexToBE('6a')
    // const varInt2 = hexToBE('fd2602')
    // const varInt3 = hexToBE('fe703a0f00')

    // const varIntToN = b => parseVarintToBN(bToStream(b)).toNumber()

    // expect(varIntToN(varInt1)).toBe(106)
    // expect(varIntToN(varInt2)).toBe(550)
    // expect(varIntToN(varInt3)).toBe(998000)

    // expect(nToVarint(106)).toEqual(varInt1)
    // expect(nToVarint(550)).toEqual(varInt2)
    // expect(nToVarint(998000)).toEqual(varInt3)
  })

  test('Exercise 5', () => {
    const hexTrxs = require('./trxs')
    const stream = bToStream(hexToBE(hexTrxs[1]))
    const trx = Transaction.parse(stream)
    expect(trx.txIns[1].scriptSig.cmds).toEqual([
      hexToBE('304402207899531a52d59a6de200179928ca900254a36b8dff8bb75f5f5d71b1cdc26125022008b422690b8461cb52c3cc30330b23d574351872b7c361e9aae3649071c1a71601'),
      hexToBE('035d5c93d9ac96881f19ba1f686f15f009ded7c62efe85a872e6a19b43c15a2937'),
    ])
    // expect(trx.txOuts[0].scriptPubkey).toBe('') // TODO
    expect(trx.txOuts[1].amount).toBeBN(40000000)
  })
})

describe('Script', () => {
  const Script = require('./Script')
  const _b0 = Buffer.from([0])
  const _b1 = Buffer.from([1])

  beforeAll(() => {
  })

  test('Exercise 3', () => {
    // 76 76 95 93 56 87
    console.log({ Script })
    const scriptPubkey = Script.fromString('OP_DUP OP_DUP OP_MUL OP_ADD 6 OP_EQUAL')
    const scriptSig = Script.fromString('2')
    const script = scriptSig.add(scriptPubkey)
    const { stack: [top] } = script.run()
    expect(top).toEqual(_b1)
  })

  test('Exercise 4', () => {
    /*
     * credit: Peter Todd
     * https://www.blockchain.com/btc/tx/8d31992805518fd62daa3bdd2a5c4fd2cd3054c9b3dca1d78055e9528cff6adc?show_adv=true
     */
    // 6e 87 91 69 a7 7c a7 87
    const scriptPubkey = Script.fromString('OP_2DUP OP_EQUAL OP_NOT OP_VERIFY OP_SHA1 OP_SWAP OP_SHA1 OP_EQUAL')
    const scriptSig = (() => {
      const fs = require('fs')
      const collision1 = fs.readFileSync('./sha1_shattered/shattered-1.pdf')
      const collision2 = fs.readFileSync('./sha1_shattered/shattered-2.pdf')
      return new Script([collision1, collision2])
    })()
    const success = scriptSig.add(scriptPubkey)
    const failed2 = Script.fromString('1 2').add(scriptPubkey)
    const failed1 = Script.fromString('1 1').add(scriptPubkey)
    expect(success.run().stack[0]).toEqual(_b1)
    expect(failed2.run().stack[0]).toEqual(_b0)
    expect(failed1.run().state).toBe('invalid')
  })
})

describe('7. Transaction Creation and Validation', () => {
  // TODO: mock node-fetch!
  const Transaction = require('./Transaction')
  const sample = [
    {
      id: '59937f5d2723a6ec65b45f47a936b0dd87e8e7bcbb7c16f234adaf035d9e8adb',
      tx_hex: '02000000036a734e2d4387b138158eeeefd6b119a8c69d5506e8dedb5957313cac82624d60000000008a47304402206ad981b70d86d6de6fb1e642c5fb7e75d7d89906c1050681fe3e554985f89a17022012d342904eba8b9cdfd4e5e7ce3b3a1e0340918ee4079b444e801ff4214957260141047a668e0ee73a973d728308fa256aaefc975ae11556409289d5fcb2d66a8f15d34585c122b8702443fe2655a5184f8b91fcc62aeb4a03bd346028fa83dff969a3ffffffffad8672b83ef18a80ecdffa90ba28d085d2d741bb95d5fa52db1963893a12fdbd010000008a473044022026f3d8423f3e2570b1907f69299612489f917c2109d142c08c42603dcf40a944022073c46b93ca1d920027af49a349b6bdfb36bace0f069d16b5bea44915d9125a5b0141047a668e0ee73a973d728308fa256aaefc975ae11556409289d5fcb2d66a8f15d34585c122b8702443fe2655a5184f8b91fcc62aeb4a03bd346028fa83dff969a3ffffffffdb317e1026e793bad054dea8d2bfe5c452be16c08ea2e60b156b045edb157c8e000000008a47304402203142592a6281d81afc93286f305784c09ef1892cdcd0ac81cec3cf3d403088ab022014540215f9d7d458f89f522effb7a17c0f44771e0ee648ee9cb22d2b8e33c65f0141047a668e0ee73a973d728308fa256aaefc975ae11556409289d5fcb2d66a8f15d34585c122b8702443fe2655a5184f8b91fcc62aeb4a03bd346028fa83dff969a3ffffffff020b4c00000000000017a914a4edbb82d6a77c2660ea06eaa489609a27bd9688877a600200000000001976a9144433b446eca6ab54d8d9cb7acd6d94d20f37e50c88ac00000000',
    },
    {
      tx_hex: '0100000001813f79011acb80925dfe69b3def355fe914bd1d96a3f5f71bf8303c6a989c7d1000000006b483045022100ed81ff192e75a3fd2304004dcadb746fa5e24c5031ccfcf21320b0277457c98f02207a986d955c6e0cb35d446a89d3f56100f4d7f67801c31967743a9c8e10615bed01210349fc4e631e3624a545de3f89f5d8684c7b8138bd94bdd531d2e213bf016b278afeffffff02a135ef01000000001976a914bc3b654dca7e56b04dca18f2566cdaf02e8d9ada88ac99c39800000000001976a9141c4bc762dd5423e332166702cb75f40df79fea1288ac19430600',
      sigHash0: '27e0c5994dec7824e56dec6b2fcb342eb7cdb0d0957c2fce9882f715e85d81a6',
    },
  ]

  beforeAll(() => {})

  test('Verify id', () => {
    const testnet = true
    const trx = Transaction.parse(bToStream(hexToBE(sample[0].tx_hex)), testnet)
    expect(trx.id()).toBe(sample[0].id)
  })

  test('Verify fee', async () => {
    const testnet = true
    const trx = Transaction.parse(bToStream(hexToBE(sample[0].tx_hex)), testnet)
    const result = await trx.fee()
    expect(result).toBeBN(10000)
  })

  test('Exercise 1', async () => {
    const testnet = false
    const raw = hexToBE(sample[1].tx_hex)
    const trx = Transaction.parse(raw, testnet)
    const result = await trx.sigHash(0)
    expect(result).toEqual(hexToBE(sample[1].sigHash0))
  })

  test('Exercise 2', async () => {
    const testnet = false
    const raw = hexToBE(sample[1].tx_hex)
    const trx = Transaction.parse(raw, testnet)
    const result = await trx.verifyInput(0)
    expect(result).toBe(true)
  })

  test('fromP2pkh()', () => {
    const { fromBs58Check } = require('./addressCodec')
    const { fromP2pkh } = require('./Script')
    expect(
      fromP2pkh(fromBs58Check('p2pkh', '1JAHBxA51vwp5C2zpSB15VbxSZK3hVJs2H'))
        .serialize()
        .toString('hex')
    ).toBe('1976a914bc3b654dca7e56b04dca18f2566cdaf02e8d9ada88ac')
  })

  test.skip('Create Transaction', async () => {
    const { fromBs58Check } = require('./addressCodec')
    // const trx = await Transaction.createSimpleP2pkh(
    //   '0d6fe5213c0b3291f208cba8bfb59b7476dffacc4e5cb66f6eb20a080843a299', 13,
    //   'mnrVtF8DWjMu839VW3rBfgYaAfKk8983Xf', String(0.1 * 100000000),
    //   'mzx5YhAH9kNHtcN481u6WkjeHjYtVeKVh2', String(0.33 * 100000000),
    //   8675309,
    // )
    // const trx = await Transaction.createSimpleP2pkh(
    //   '75a1c4bc671f55f626dda1074c7725991e6f68b8fcefcfca7b64405ca3b45f1c', 1,
    //   'miKegze5FQNCnGw6PKyqUbYUeBa4x2hFeM', '1000000',
    //   'mzx5YhAH9kNHtcN481u6WkjeHjYtVeKVh2', '899999',
    //   8675309,
    // )

    // d98ec753d79e74542e91b36ab747942dc9b8b78f9d79320ba6e8bf23166e209c
    // const trx = await Transaction.createSimpleP2pkh(
    //   '5a98e2db0f5f15eef3482b43ad596f0c9562e1e0b0e792df6052e7794a1eb172', 1,
    //   'mwJn1YPMq7y5F8J3LkC5Hxg9PHyZ5K4cFv', '100000',
    //   'mr7cEkw3hKQce1rH38mZn6Zgx8Y569fqUf', '198983',
    //   fromBs58Check('tcWIF', 'cTgdLEgnsaPAF5NoXbuZdwGbgRxPAFm34EPDUEGq8VQ3ubRmnxrx')
    // )
    // console.log(trx, trx.id(), trx.serialize().toString('hex'))
    // console.log(
    //   trx.txIns[0].scriptSig,
    //   trx.txOuts[0].scriptPubkey,
    //   trx.txOuts[1].scriptPubkey,
    // )

    /*
     * Transaction.createSimpleP2pkh(
     *   ...[id, ix],
     *   ...[addr, amount],
     *   ...[addr, amount],
     *   privateKey,
     * )
     */
    const trx = await Transaction.createSimpleP2pkh(
      '4abfaab6a2825db49aec26c2d91d80411d5bc3881a169ad2c014ce78c5ef999e', 1,
      'mwJn1YPMq7y5F8J3LkC5Hxg9PHyZ5K4cFv', '540',
      'n13HKC5Qny4dzZcRzvKev65CbMCiLFQVxR', '4034191',
      fromBs58Check('tcWIF', 'cPUHfGjC3AnRmTQgWtuhwfQ5uqo4SHXro7ERTxQkFDNHwb2tnTpj')
    )
    console.log(trx, trx.id(), trx.serialize().toString('hex'))
  })
})
