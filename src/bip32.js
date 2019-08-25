// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
// https://iancoleman.io/bip39/
//
// node = {
//   /* buffer 32bit */ fingerprint,
//   /* number */ childNumber,
//   /* number */ depth,
//   /* buffer 256bit */ key,
//   /* buffer 264bit */ key, // neutered
//   /* buffer 256bit */ chainCode,
//   /* lambda */ toPublic,
//   /* lambda */ derivePath,
// }
//
// TODO: network management
// TODO: better concat()
// TODO: rename toHexString -> toHexNotation
//
const R = require('ramda')
const { __, o, prop, pipe, init, last, isEmpty, compose } = R

const toHexNotation = require('./toHexString')
const nToUInt32BE = require('./nToUInt32BE')
const nToUInt8 = require('./nToUInt8')
const concat = require('./concat')
const base58check = require('./base58check')
const hmacSHA512 = require('./hmacSHA512')
const ripemd160 = require('./ripemd160')
const sha256 = require('./sha256')
const entropyToMnemonic = require('./entropyToMnemonic')
const mnemonicToSeed = require('./mnemonicToSeed')
const { priv2pub, pointAdd, privateAdd, privateSub } = require('./keypair')
const { xprv, xpub, tprv, tpub, tp2pkh, tcWIF, cWIF } = require('./prefix')

const hash160 = o(ripemd160, sha256)
const split512bits = x => [x.slice(0, 32), x.slice(32, 64)]
const ZERO = Buffer.from([0])
const ONE = Buffer.from([1])
const HARDENED_IX = 0x80000000

/* node => ... */
const toXprv = o(base58check(xprv), serialize)
const toXpub = o(base58check(xpub), serialize)
const toTprv = o(base58check(tprv), serialize)
const toTpub = o(base58check(tpub), serialize)
const toAddress = compose(base58check(tp2pkh), hash160, prop('key'))
const toTCWIF = compose(base58check(tcWIF), concat(__, ONE), prop('key'))
const toCWIF = compose(base58check(cWIF), concat(__, ONE), prop('key'))

module.exports = {
  master,
  CKDpub,
  toTprv,
  toTpub,
  toXprv,
  toXpub,
  toAddress,
  toTCWIF,
  toCWIF,
}

function CKDpriv (parent, i) {
  const isHardened = i >= HARDENED_IX
  const I = hmacSHA512(parent.chainCode)(isHardened
    ? Buffer.concat([ZERO, parent.key, nToUInt32BE(i)])
    : Buffer.concat([priv2pub(parent.key), nToUInt32BE(i)])
  )
  const [IL, IR] = split512bits(I)
  const parentId = hash160(priv2pub(parent.key))
  return {
    ...parent,
    fingerprint: parentId.slice(0, 4),
    childNumber: i,
    depth: parent.depth + 1,
    key: privateAdd(IL, parent.key), // XXX: cannot use BN?
    chainCode: IR,
  }
}

function CKDpub (parent, i) {
  const isHardened = i >= HARDENED_IX
  if (parent.key.length === 32) throw new Error({ parent, i })
  if (isHardened) throw new Error({ parent, i })
  const I = hmacSHA512(parent.chainCode)(
    Buffer.concat([parent.key, nToUInt32BE(i)])
  )
  const [IL, IR] = split512bits(I)
  const parentId = hash160(parent.key)
  return {
    ...parent,
    fingerprint: parentId.slice(0, 4),
    childNumber: i,
    depth: parent.depth + 1,
    key: pointAdd(priv2pub(IL), parent.key),
    chainCode: IR,
  }
}

function serialize ({
  fingerprint,
  childNumber,
  depth,
  key: _key,
  chainCode,
}) {
  // pad leading zeros if not neutered
  const key = Buffer.alloc(33, 0)
  _key.copy(key, key.length - _key.length)
  return Buffer.concat([
    nToUInt8(depth),
    fingerprint,
    nToUInt32BE(childNumber),
    chainCode,
    key,
  ])
}

function master (seed) {
  const fn = pipe(
    hmacSHA512('Bitcoin seed'),
    split512bits,
    ([IL, IR]) => ({
      fingerprint: nToUInt32BE(0),
      childNumber: 0,
      depth: 0,
      key: IL,
      chainCode: IR,
      toPublic,
      derivePath,
    }),
  )
  return fn(seed)
}

function toPublic () {
  const _key = this.key
  return Object.assign(
    {},
    this,
    (_key.length === 33) ? {} : { key: priv2pub(_key) },
  )
}

function derivePath (_path) {
  const [curr, ...rest] = _path.split('/')
  if (curr !== 'm') throw new Error(_path)

  const derive = path => isEmpty(path)
    ? this // the `root`
    : CKDpriv(derive(init(path)), index(last(path)))

  return derive(rest)

  function index (i) {
    const harden = i => Number(i) + HARDENED_IX
    const normal = i => Number(i)
    if (/^\d+'$/g.test(i)) return harden(i.replace(/'/g, ''))
    if (/^\d+$/g.test(i)) return normal(i)
    throw new Error(i)
  }
}

// demo

const entropy = `
  c3929f36f850a859
  f0add23f71b2d68f
`
const seed = o(mnemonicToSeed, entropyToMnemonic)(entropy)
const root = master(seed)

const m = root.derivePath(`m`)
const m11 = root.derivePath(`m/1/1`)

const M = m.toPublic()
const M0 = CKDpub(M, 0)
const M1 = CKDpub(M, 1)

console.log(`m ${toTprv(m)}`)
console.log(`M ${toTpub(M)} `)
console.log(`M/0 ${toAddress(M0)} ${toHexNotation(M0.key)}`)
console.log(`M/1 ${toAddress(M1)} ${toHexNotation(M1.key)}`)

console.log('')
console.log(`*crack demo*`)
console.log(`M/1 ${toTpub(M1)} (stolen!)`)
console.log(`m/1/1 ${toTCWIF(m11)} (stolen!)`)

function crack ({ parent, child, ix }) {
  const I = hmacSHA512(parent.chainCode)(concat(parent.key, nToUInt32BE(ix)))
  const [IL] = split512bits(I)
  const _priv = privateSub(child.key, IL)
  const _pub = priv2pub(_priv)

  if (_pub.equals(parent.key)) {
    const node = Object.assign({}, parent, { key: _priv })
    console.log(`${ix}: *cracked*: ${toTprv(node)}`)
    return node
  } else {
    console.log(`${ix}: *skip*`)
    return null
  }
}

const cr = []
/* (m11, M1) => m1 */
cr.push(crack({ parent: M1, child: m11, ix: 0 }))
cr.push(crack({ parent: M1, child: m11, ix: 1 }))
/* (m1, M) => m */
cr.push(crack({ parent: M, child: cr[1], ix: 0 }))
cr.push(crack({ parent: M, child: cr[1], ix: 1 }))
