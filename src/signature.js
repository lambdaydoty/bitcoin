const R = require('ramda')
const { pipe } = R
const ecc = require('tiny-secp256k1')
const sha256 = require('./sha256')
const toHexString = require('./toHexString')
const serializeTransaction = require('./serializeTransaction')

const { privateKey, publicKey } = require('./keypair')

const trx = {
  ver: 1,
  paymentOrder: 'Alice promises to pay the sum of one Bitcoin to Bob',
}

const sign = key => trx => pipe(
  serializeTransaction,
  sha256,
  sha256,
  b => ecc.sign(b, key),
)(trx)

const signature = sign(privateKey)(trx)

console.log(
  toHexString(signature),
  ecc.verify(sha256(sha256(serializeTransaction(trx))), publicKey, signature),
)

// const secp256k1 = require('secp256k1')
// const sign2 = key => trx => pipe(
//   serializeTransaction,
//   sha256,
//   sha256,
//   b => secp256k1.sign(b, key),
//   x => x.signature,
// )(trx)
// console.log(
//   toHexString(sign2(privateKey)(trx))
// )
