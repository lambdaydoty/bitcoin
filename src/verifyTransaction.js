const { bn } = require('../utils')
const { o, ifElse, isNil, always } = require('ramda')
const cypto = require('cypto')
const secp256k1 = require('secp256k1')

const sha256 = require('./sha256')
const ripemd160 = require('./ripemd160')
const toReverseHexNotation = require('./toReverseHexNotation')
const hexNotationToUInt256LE = require('./hexNotationToUInt256LE')
const nToUInt8 = require('./nToUInt8')
const nToUInt32LE = require('./nToUInt32LE')
const nToUInt64LE = require('./nToUInt64LE')
const serializeAmount = amount => nToUInt64LE(bn(amount).times(100000000))

const ops = {
  'OP_ADD': 0x93,
  'OP_DUP': 0x76,
  'OP_HASH160': 0xa9,
  'OP_EQUALVERIFY': 0x88,
  'OP_CHECKSIG': 0xac
}

function serializeTransaction (trx) {
  const empty = Buffer.alloc(0)
  return Buffer.concat([
    nToUInt32LE(trx.version),
    serializeInputs(trx.inputs),
    serializeOutputs(trx.outputs),
    nToUInt32LE(trx.lockTime),
    ifElse(
      isNil,
      always(empty),
      o(nToUInt32LE, Number),
    )(trx.hashType),
  ])
}

function serializeInputs (inputs) {
  return Buffer.concat([
    nToUInt8(inputs.length),
    Buffer.concat(
      inputs.map(input => Buffer.concat([
        hexNotationToUInt256LE(input.txid),
        nToUInt32LE(input.index),
        compileScript(input.script),
        nToUInt32LE(0xffffffff),
      ]))
    ),
  ])
}

function serializeOutputs (outputs) {
  return Buffer.concat([
    nToUInt8(outputs.length),
    Buffer.concat(
      outputs.map(output => Buffer.concat([
        serializeAmount(output.amount),
        compileScript(output.script),
      ]))
    ),
  ])
}

function compileScript (program) {
  gtgtgt
}

