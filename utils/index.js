const assert = require('assert')
const { Readable } = require('stream')
const fetch = require('node-fetch')
const R = require('ramda')
const BN = require('bn.js')
const crypto = require('crypto')
const { o, __ } = R
const { curryN } = R
const { tryCatch, always } = R

const hash256 = o(sha256, sha256)
const hash160 = o(ripemd160, sha256)

// eg.
//   bn('abcd', 16)
//   bn('100001', 2)
//   bn('65536')
//   bn(65536)
// A wrapper for `new BN(...)`
const bn = Object.assign(
  (...args) => new BN(...args),
  {
    CONSTANT: {
      _0: new BN(0),
      _1: new BN(1),
      _2: new BN(2),
      _3: new BN(3),
      _4: new BN(4),
      _5: new BN(5),
      _6: new BN(6),
      _7: new BN(7),
      _8: new BN(8),
      _9: new BN(9),
      _32: new BN(32),
      _256: new BN(256),
      _977: new BN(977),
    },
  },
)

// A wrapper for `new BN(...).toRed()`
// eg.
//   rn = red(bn(7))
//   rn(3).redAdd( rn(4) ) => 0
const red = (num) => {
  assert.ok(BN.isBN(num))
  const redContext = BN.red(num)
  return (...args) => new BN(...args).toRed(redContext)
}

module.exports = {
  red,
  bn,
  BN,
  safeEval,
  toBeBN,
  bToStream,
  bToBN,
  nToBE,
  nToLE,
  hash256,
  hash160,
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
 * Prototyping Buffer, Array
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
Buffer.prototype.clone = function () {
  return Buffer.from(this)
}

/* eslint no-extend-native: ["error", { "exceptions": ["Array"] }] */
// A workaround, otherwise we should extend Array
Array.prototype.clone = function () {
  return Array.from(this.map(R.clone))
}

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
    received.eq(bn(expected))
  const passMessage = () => `expected ${received} not to be BN (${expected})`
  const notPassMessage = () => `expected ${received} to be BN (${expected})`
  return {
    pass,
    message: pass ? passMessage : notPassMessage,
  }
}

function nToBE (bits) {
  return function (n) {
    return bn(n).toBuffer('be', bits ? bits / 8 : undefined)
    // return bn(n).toBuffer('be', bits / 8)
  }
}

function nToLE (bits) {
  return function (n) {
    return bn(n).toBuffer('le', bits ? bits / 8 : undefined)
    // return bn(n).toBuffer('le', bits / 8)
  }
}

function bToBN (config) {
  return function (buffer) {
    if (config === 'be') {
      return bn(buffer.toString('hex'), 16)
    } else if (config === 'le') {
      return bn(
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

/*
 * Eg.
 *  hexToBE('001122')
 *  hexToBE('001122', 32)
 *  hexToBE('0x00')
 *  hexToBE(`ff \n ff`)
 */
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
  const { compose: o, invoker, cond, T } = require('ramda')
  const { concat } = require('../utils')

  const _0xfd = bn('fd', 16)
  const _0x10000 = bn('10000', 16)
  const _0x100000000 = bn('100000000', 16)
  const _0x10000000000000000 = bn('10000000000000000', 16)

  const lt = invoker(1, 'lt')
  const toBuffer = invoker(2, 'toBuffer')

  return cond([
    [lt(_0xfd), toBuffer('le', 1)],
    [lt(_0x10000), o(concat(nextTwoBytes), toBuffer('le', 2))],
    [lt(_0x100000000), o(concat(nextFourBytes), toBuffer('le', 4))],
    [lt(_0x10000000000000000), o(concat(nextEightBytes), toBuffer('le', 8))],
    [T, assert.fail],
  ])(bn(_n))
}
