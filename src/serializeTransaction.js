// const R = require('ramda')
// const { always, pipe } = R
// const sha256 = require('./sha256')
// const toReverseHexNotation = require('./toReverseHexNotation')
// const toHexString = require('./toHexString')
const nToUInt32LE = require('./nToUInt32LE')
const nToUInt8 = require('./nToUInt8')

function serializeTransaction (trx) {
  return Buffer.concat([
    nToUInt32LE(trx.ver),
    nToUInt8(trx.paymentOrder.length),
    Buffer.from(trx.paymentOrder),
  ])
}

// const trx = {
//   ver: 1,
//   paymentOrder: 'Alice promises to pay the sum of one Bitcoin to Bob',
// }

// console.log(
//   toHexString(serializeTransaction(trx))
// )

// const id = pipe(
//   always(trx),
//   serializeTransaction,
//   sha256,
//   sha256,
//   toReverseHexNotation,
// )()

// console.log(id)

module.exports = serializeTransaction
