const R = require('ramda')
const { pipe } = R

const concat = require('./concat')
const sha256 = require('./sha256')
const nToInt32LE = require('./nToInt32LE')
// const toHexString = require('./toHexString')
const toReverseHexNotation = require('./toReverseHexNotation')
const { nat } = require('./generators')

function calculateProofOfWork (proof, message /* buffer */) {
  const fn = pipe(
    nToInt32LE,
    concat(message),
    sha256,
    toReverseHexNotation,
    x => x.substr(0, proof.length),
  )
  const nn = nat() // natural numbers
  for (const n of nn) {
    if (fn(n) === proof) {
      return nToInt32LE(n)
    }
  }
}

const message = Buffer.from('hello world')

function testPoW (loops, message) {
  for (let proof = '0'; proof.length <= loops; proof += '0') {
    const t0 = Date.now()
    const nonce = calculateProofOfWork(proof, message)
    const t1 = Date.now()
    console.log(
      `hash: ${toReverseHexNotation(sha256(concat(message)(nonce)))}`,
      `nonce: ${toReverseHexNotation(nonce)}`,
      `elapsedTime: ${t1 - t0}`,
    )
  }
}

testPoW(5, message)
