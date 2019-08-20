const R = require('ramda')
const { pick } = R
const sha256 = require('./sha256')
const nToUInt32LE = require('./nToUInt32LE')
const hexNotationToLE = require('./hexNotationToLE')
const toReverseHexNotation = require('./toReverseHexNotation')
const get = require('./get')

function serializeHeader (header) {
  return Buffer.concat([
    nToUInt32LE(header.ver),
    hexNotationToLE(header.prev_block),
    hexNotationToLE(header.mrkl_root),
    nToUInt32LE(header.time),
    nToUInt32LE(header.bits), // the target
    nToUInt32LE(header.nonce),
  ])
}

;(async () => {
  const block = 125552
  const result = await get(`https://blockchain.info/block-height/${block}?format=json`)
  const header = pick([
    'ver',
    'prev_block',
    'mrkl_root',
    'time',
    'bits',
    'nonce',
  ])(result.blocks[0])
  const hash = sha256(sha256(serializeHeader(header)))
  console.log(toReverseHexNotation(hash))
})()

// {
//     "hash":"00000000000000001e8d6829a8a21adc5d38d0a473b144b6765798e61f98bd1d",
//     "ver":1,
//     "prev_block":"00000000000008a3a41b85b8b29ad444def299fee21793cd8b9e567eab02cd81",
//     "mrkl_root":"2b12fcf1b09288fcaff797d71e950e71ae42b91e8bdb2304758dfcffc2b620e3",
//     "time":1305998791,
//     "bits":440711666,
//     "fee":1000000,
//     "nonce":2504433986,
//     "n_tx":4,
//     "size":1496,
//     "block_index":140402,
//     "main_chain":true,
//     "height":125552,
//     "tx":[ ... ]
// }
