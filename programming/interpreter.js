const { isEmpty, either, slice, findIndex, isNil, both, propEq } = require('ramda')
const { hash256, sha1 } = require('../utils')
const opcodes = require('./opcodes')

module.exports = function (_program, config) {
  const program = level(_program)

  if (config) pretty(program)

  const init = {
    mainStack: [],
    altStack: [],
    state: true,
    level: 0,
  }

  return run(init, program)
}

function run (machine, program) {
  console.log({ machine, program })
  const _b01 = Buffer.from([1])
  const _b00 = Buffer.from([0])
  if (isEmpty(program)) return machine

  // const { mainStack, altStack, state, z } = machine
  const { mainStack, altStack, state } = machine
  const [[level, cmd], ...rest] = program

  const matchElse = both(propEq(0, level), propEq(1, opcodes.OP_ELSE))
  const matchEndIf = both(propEq(0, level), propEq(1, opcodes.OP_ENDIF))

  const alt = findIndex(either(matchElse, matchEndIf), rest)

  if (cmd === opcodes['OP_IF']) {
    const x = mainStack.pop().toBN('le')
    return !x.isZero()
      ? run({ mainStack, altStack, state }, rest)
      : run({ mainStack, altStack, state }, slice(alt + 1, Infinity, rest))
  }

  if (cmd === opcodes['OP_ELSE']) {
    return run({ mainStack, altStack, state }, slice(alt + 1, Infinity, rest))
  }

  if (cmd === opcodes['OP_ENDIF']) {
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_VERIFY']) {
    const x = mainStack.pop()
    let state
    if (!x.equals(_b01)) {
      state = 'invalid'
    }
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_SWAP']) {
    const x = mainStack.pop()
    const y = mainStack.pop()
    mainStack.push(x)
    mainStack.push(y)
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_2DUP']) {
    const x = mainStack.pop()
    const y = mainStack.pop()
    mainStack.push(y)
    mainStack.push(x)
    mainStack.push(y)
    mainStack.push(x)
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_DUP']) {
    const x = mainStack.pop()
    mainStack.push(x)
    mainStack.push(x)
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_EQUAL']) {
    const x = mainStack.pop()
    const y = mainStack.pop()
    const r = x.equals(y)
    mainStack.push(r ? _b01 : _b00)
    return run({ mainStack, altStack, state }, rest)
  }

  // NOTE: all numbers are stored in little-endian

  if (cmd === opcodes['OP_NOT']) {
    const x = mainStack.pop()
    if (x.equals(_b00)) {
      mainStack.push(_b01)
    } else {
      mainStack.push(_b00)
    }
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_ADD']) {
    const x = mainStack.pop().toBN('le')
    const y = mainStack.pop().toBN('le')
    mainStack.push(x.add(y).toBuffer('le'))
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_SUB']) {
    const x = mainStack.pop().toBN('le')
    const y = mainStack.pop().toBN('le')
    mainStack.push(y.sub(x).toBuffer('le'))
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_MUL']) {
    const x = mainStack.pop().toBN('le')
    const y = mainStack.pop().toBN('le')
    mainStack.push(y.mul(x).toBuffer('le'))
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_HASH256']) {
    const x = mainStack.pop()
    mainStack.push(hash256(x))
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_SHA1']) {
    const x = mainStack.pop()
    mainStack.push(sha1(x))
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_HASH160']) {
    const x = mainStack.pop()
    mainStack.push(hash256(x))
    return run({ mainStack, altStack, state }, rest)
  }

  if (cmd === opcodes['OP_CHECKSIG']) {}
  if (cmd === opcodes['OP_CHECKSIGVERIFY']) {}
  if (cmd === opcodes['OP_CHECKMULTISIG']) {}
  if (cmd === opcodes['OP_CHECKMULTISIGVERIFY']) {}

  const data = cmd
  mainStack.push(data)

  return run({ mainStack, altStack, state }, rest)

  // throw new Error(cmd)
}

function level (program) {
  /*
   * buffer form: [<B 01>, <B 01>, 0x93]
   */
  return recur(program, 0)

  function recur ([head, ...tail], lv) {
    if (isNil(head)) return []
    if (head === opcodes.OP_IF) return [ [lv, head], ...recur(tail, lv + 1) ]
    if (head === opcodes.OP_ELSE) return [ [lv - 1, head], ...recur(tail, lv) ]
    if (head === opcodes.OP_ENDIF) return [ [lv - 1, head], ...recur(tail, lv - 1) ]
    return [ [lv, head], ...recur(tail, lv) ]
  }
}

function pretty (program) {
  for (let i = 0; i < program.length; ++i) {
    const SPACE = ' |      '
    const [indent, cmd] = program[i]
    const sp = Array.from({ length: indent }, () => SPACE).join('')
    console.log(sp, cmd)
  }
}
