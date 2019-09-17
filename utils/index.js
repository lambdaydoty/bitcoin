const { Readable } = require('stream')
const fetch = require('node-fetch')
const R = require('ramda')
const BN = require('bn.js')
const crypto = require('crypto')
const { o, __ } = R
const { curryN } = R
const { tryCatch, always } = R

module.exports = {
  safeEval,
  toBeBN,
  bToStream,
  bToBN,
  nToBE,
  nToLE,
  hash256: o(sha256, sha256),
  hash160: o(ripemd160, sha256),
  sha1,
  sha256,
  ripemd160,
  toHex,
  hexToBE,
  concat,
  concatN,
  prefix,
  suffix,
  get,
  parseVarintToBN,
  nToVarint,
}

/*
 * Prototyping Buffer
 */
Buffer.prototype.reverse = function () {
  return Buffer.from(
    this.toString('hex').match(/.{2}/g).reverse().join(''),
    'hex',
  )
}
Buffer.prototype.toBN = function (endianness) {
  return bToBN(endianness)(this)
}
Buffer.prototype.concat = function (that) {
  return Buffer.concat([this, that])
}
// Buffer.prototype.toNumber = function (endianness) {
//   return bToBN(endianness)(this).toNumber()
// }

function safeEval (fn) {
  return tryCatch(fn, always(null))
}

function concat (...args) {
  const fn = curryN(2, (x, y) => Buffer.concat([x, y]))
  return fn(...args)
}

function concatN (...args) {
  return args.reduce(concat, Buffer.from([]))
}

function prefix (x) {
  return concat(x)
}

function suffix (x) {
  return concat(__, x)
}

function toBeBN (received, expected) {
  const pass = BN.isBN(received) &&
    received.eq(new BN(expected))
  const passMessage = () => `expected ${received} not to be BN (${expected})`
  const notPassMessage = () => `expected ${received} to be BN (${expected})`
  return {
    pass,
    message: pass ? passMessage : notPassMessage,
  }
}

function nToBE (bits) {
  return function (n) {
    return new BN(n).toBuffer('be', bits ? bits / 8 : undefined)
    // return new BN(n).toBuffer('be', bits / 8)
  }
}

function nToLE (bits) {
  return function (n) {
    return new BN(n).toBuffer('le', bits ? bits / 8 : undefined)
    // return new BN(n).toBuffer('le', bits / 8)
  }
}

function bToBN (config) {
  return function (buffer) {
    if (config === 'be') {
      return new BN(buffer.toString('hex'), 16)
    } else if (config === 'le') {
      return new BN(
        buffer.toString('hex').match(/.{1,2}/g).reverse().join(''),
        16,
      )
    } else {
      throw new Error(config)
    }
  }
}

function sha1 (b) {
  return crypto
    .createHash('sha1')
    .update(b)
    .digest()
}

function sha256 (b) {
  return crypto
    .createHash('sha256')
    .update(b)
    .digest()
}

function ripemd160 (b) {
  return crypto
    .createHash('ripemd160')
    .update(b)
    .digest()
}

function toHex (b) {
  return b.toString('hex')
}

function hexToBE (hex, bits = 0) {
  const max = (a, b) => a > b ? a : b
  const norm = hex.replace(/^0x/g, '').replace(/(\n|\s)/mg, '')
  const len = Math.ceil(norm.length / 2) * 2
  const pad = norm.padStart(max(bits / 4, len), '0')
  return Buffer.from(pad, 'hex')
}

function bToStream (buffer) {
  // good for testing
  // https://stackoverflow.com/questions/13230487/converting-a-buffer-into-a-readablestream-in-node-js
  const readable = new Readable()
  readable._read = () => {}
  readable.push(buffer)
  readable.push(null)
  return readable
}

async function get (url, headers = {}) {
  const res = await fetch(url, { method: 'GET', headers })
  return res.clone().json()
    .catch(() => res.clone().text())
}

const nextTwoBytes = Buffer.from([0xfd])
const nextFourBytes = Buffer.from([0xfe])
const nextEightBytes = Buffer.from([0xff])

function parseVarintToBN (/* Readable */ stream) {
  const { Readable } = require('stream')
  const assert = require('assert')
  const { always, equals, compose: o, invoker, cond, T, isNil } = require('ramda')

  assert.ok(stream instanceof Readable)

  const readS = invoker(1, 'read')

  return cond([
    [isNil, always(null)],
    [equals(nextTwoBytes), o(bToBN('le'), readS(2), always(stream))],
    [equals(nextFourBytes), o(bToBN('le'), readS(4), always(stream))],
    [equals(nextEightBytes), o(bToBN('le'), readS(8), always(stream))],
    [T, bToBN('le')],
  ])(readS(1)(stream))
}

/**
 * @return {Buffer}
 */
function nToVarint (_n) {
  const BN = require('bn.js')
  const { compose: o, invoker, cond, T } = require('ramda')
  const { concat } = require('../utils')

  const _0xfd = new BN('fd', 16)
  const _0x10000 = new BN('10000', 16)
  const _0x100000000 = new BN('100000000', 16)
  const _0x10000000000000000 = new BN('10000000000000000', 16)

  const lt = invoker(1, 'lt')
  const toBuffer = invoker(2, 'toBuffer')

  return cond([
    [lt(_0xfd), toBuffer('le', 1)],
    [lt(_0x10000), o(concat(nextTwoBytes), toBuffer('le', 2))],
    [lt(_0x100000000), o(concat(nextFourBytes), toBuffer('le', 4))],
    [lt(_0x10000000000000000), o(concat(nextEightBytes), toBuffer('le', 8))],
    [T, () => { throw new Error(_n) }],
  ])(new BN(_n))
}
