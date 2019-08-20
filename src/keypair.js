const ecc = require('tiny-secp256k1')

const BASE_POINT = [
  '04',
  '79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798',
  '483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8',
]

// const priv = Buffer.from('27d9b1f6d8567054f1542760ff943d0582e95bd8c1ba08355c02536a5aaac4cc', 'hex')

const G = Buffer.from(BASE_POINT.join(''), 'hex')
const priv2pub = b => ecc.pointMultiply(G, b, /* compressed? */ true)
const pointAdd = (A, B) => ecc.pointAdd(A, B, /* compressed? */ true)
const privateAdd = (d, tweak) => ecc.privateAdd(d, tweak)
const privateSub = (d, tweak) => ecc.privateSub(d, tweak)

// module.exports = {
//   privateKey: priv,
//   publicKey: priv2pub(priv),
// }

module.exports = {
  priv2pub,
  pointAdd,
  privateAdd,
  privateSub,
}

// pub = priv * G

// console.log(`Is point? ${ecc.isPoint(G)}`)
// console.log(`Is point? ${ecc.isPoint(pub)}`)
// console.log(`Is pub point compressed? ${ecc.isPointCompressed(pub)}`)
// console.log('pub:', pub.toString('hex'))
