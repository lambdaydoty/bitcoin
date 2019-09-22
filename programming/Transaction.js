const { hexToBE, hash256, nToVarint, suffix } = require('../utils')
const Script = require('./Script')
const Input = require('./Input')
const Output = require('./Output')
// const Script = require('./Script')
const trxParser = require('./trxParser')
const R = require('ramda')
const { and, range, concat, invoker } = R
const { fromBs58Check } = require('./addressCodec')
const BN = require('bn.js')
const bn = (...x) => new BN(...x)

const SIGHASH_ALL = hexToBE('01000000')
// const SIGHASH_ALL = hexToBE('01')

/*
 * Datatypes:
 *  Transaction
 *  Input
 *  Output
 *  Script
 *  Array
 *  Buffer
 *  BN (bn, gn, rn, ...)
 *  Validation
 *
 * Human-readable
 *  HexString
 *  NumberString
 *  Number
 */

class Transaction {
  constructor (version, txIns, txOuts, locktime, testnet = false) {
    this.version = version
    this.txIns = txIns
    this.txOuts = txOuts
    this.locktime = locktime
    this.testnet = testnet
  }

  toString () {
    return `
      id: ${this.id()}
      version: ${this.version.toNumber()}
      txIns: ${this.txIns}
      txOuts: ${this.txOuts}
      locktime: ${this.locktime.toNumber()}
    `
  }

  id () {
    return hash256(this.serialize()).reverse().toString('hex')
  }

  serialize () {
    const serialize = invoker(0, 'serialize')
    return Buffer.concat([
      this.version.toBuffer('le', 4),
      nToVarint(this.txIns.length),
      this.txIns.map(serialize).reduce(concat),
      nToVarint(this.txOuts.length),
      this.txOuts.map(serialize).reduce(concat),
      this.locktime.toBuffer('le', 4),
    ])
  }

  /*
   * NOTE:
   *  We need to implement clone methods for:
   *    1. Transaction
   *    2. Array (through prototyping)
   *    3. Input
   *    4. Output
   *    5. Script
   *  (Optional 6. Buffer, also through prototyping)
   */
  clone () {
    return new Transaction(
      R.clone(this.version),
      R.clone(this.txIns),
      R.clone(this.txOuts),
      R.clone(this.locktime),
      R.clone(this.testnet),
    )
  }

  async fee () {
    const sum = invoker(1, 'add')
    const { txIns, txOuts, testnet } = this
    const totalIns = await Promise.all(txIns.map(x => x.value(testnet)))
    const totalOuts = txOuts.map(x => x.amount)
    return totalIns.reduce(sum).sub(
      totalOuts.reduce(sum)
    )
  }

  async sigHash (inputIndex, type = SIGHASH_ALL) {
    const that = this
    const cloned = that.clone()

    /* !SIDE EFFECT! */
    for (let i = 0; i < cloned.txIns.length; ++i) {
      cloned.txIns[i].scriptSig = (i === inputIndex)
        ? await cloned.txIns[i].scriptPubkey(that.testnet)
        : new Script()
    }

    const raw = suffix(type)(cloned.serialize())
    return hash256(raw)
  }

  async verifyInput (inputIndex, config) {
    const that = this
    const i = inputIndex
    const z = await that.sigHash(i, SIGHASH_ALL)
    const locking = await that.txIns[i].scriptPubkey(that.testnet)
    const unlocking = that.txIns[i].scriptSig
    const result = unlocking.add(locking).run({ z, ...config })
    return !result.stack.pop().toBN('le').isZero()
  }

  async verify () {
    // Omit: Double-spend, ...
    const that = this
    const verifyInput = this.verifyInput.bind(this)
    const n = that.txIns.length
    const fee = await that.fee()
    const isPassedInputs = await Promise.all(range(0, n).map(verifyInput))
    return !fee.isNeg() && isPassedInputs.reduce(and)
  }

  static parse (stream, testnet) {
    const { version, inputs, outputs, locktime } = trxParser(stream, testnet)
    return new Transaction(
      version,
      inputs.map(data => new Input(...data)),
      outputs.map(data => new Output(...data)),
      locktime,
      testnet,
    )
  }

  /*
   * @param {string} _prevTrx
   * @param {number} _prevIndex
   * @param {string} _targetAddress
   * @param {string} _targetAmount
   * @param {string} _changeAddress
   * @param {string} _changeAmount
   * @param {number|secp256k1.gn} _priv
   */
  static async createSimpleP2pkh (
    _prevTrx,
    _prevIndex,
    _targetAddress,
    _targetAmount,
    _changeAddress,
    _changeAmount,
    _priv, // TODO: priv format: number, gn, buffer? -> privatekeyclass
  ) {
    // TODO: network
    const { sign } = require('./ecdsa')
    const prevTrx = hexToBE(_prevTrx)
    const prevIndex = bn(_prevIndex)
    const targetScript = Script.fromP2pkh(fromBs58Check('tp2pkh', _targetAddress)) // TODO: functional
    const targetAmount = bn(_targetAmount)
    const changeScript = Script.fromP2pkh(fromBs58Check('tp2pkh', _changeAddress))
    const changeAmount = bn(_changeAmount)

    const trx = new Transaction(
      bn(1),
      [
        new Input(prevTrx, prevIndex, null, bn('ffffffff', 16)),
      ],
      [
        new Output(targetAmount, targetScript),
        new Output(changeAmount, changeScript),
      ],
      bn(0),
      true,
    )

    const z = await trx.sigHash(0, SIGHASH_ALL)
    const e = _priv

    const result = sign(e, z)

    const sigDER_ = result.toDER().concat(trim(SIGHASH_ALL))
    const pubSEC = result.P.toSEC()

    /* !SIDE EFFECT! */
    trx.txIns[0].scriptSig = Script.fromSigPk(sigDER_, pubSEC)

    return trx
  }
}

function trim (buf) {
  return buf.toBN('le').toBuffer('le')
}

module.exports = Transaction
