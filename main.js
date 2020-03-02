const Transaction = require('./programming/Transaction')

// const trxFetcher = require('./programming/trxFetcher')
// const R = require('ramda')
// const id = '59937f5d2723a6ec65b45f47a936b0dd87e8e7bcbb7c16f234adaf035d9e8adb'

// trxFetcher(id, true)
//   .then(raw => Transaction.parse(raw, true))
//   .then(R.tap(console.log))
//   .then(trx => trx.fee())
//   .then(Number)
//   .then(console.log)
//   // .then(console.log)

/*
 * Programming Bitcoin: Chapter 7, example
 */
const testnet = false
const hex = '0100000001813f79011acb80925dfe69b3def355fe914bd1d96a3f5f71bf8303c6a989c7d1000000006b483045022100ed81ff192e75a3fd2304004dcadb746fa5e24c5031ccfcf21320b0277457c98f02207a986d955c6e0cb35d446a89d3f56100f4d7f67801c31967743a9c8e10615bed01210349fc4e631e3624a545de3f89f5d8684c7b8138bd94bdd531d2e213bf016b278afeffffff02a135ef01000000001976a914bc3b654dca7e56b04dca18f2566cdaf02e8d9ada88ac99c39800000000001976a9141c4bc762dd5423e332166702cb75f40df79fea1288ac19430600'
const raw = Buffer.from(hex, 'hex')
const trx = Transaction.parse(raw, testnet)
const id = trx.id()

console.log({ id })

;(async () => {
  console.log(
    // await trx.verifyInput(0, { log: true })
    await trx.verify()
  )
})()
