const { includes, isEmpty, either, slice, findIndex, isNil, both, propEq } = require('ramda')
const opcodes = require('./opcodes')
const operator = require('./operator')

module.exports = function (_program, config) {
  const program = level(_program)

  if (config) pretty(program)

  const init = {
    stack: [],
    state: undefined,
    level: 0,
  }

  return run(init, program)
}

function run (machine, program) {
  console.log({ machine, program })

  if (isEmpty(program)) return machine

  const { stack, state, z } = machine
  const [ [level, cmd], ...conti ] = program

  if (includes(cmd, opcodes.OP_CONTROL_FLOWS)) {
    const matchElse = both(propEq(0, level), propEq(1, opcodes.OP_ELSE))
    const matchEndIf = both(propEq(0, level), propEq(1, opcodes.OP_ENDIF))
    const ind = findIndex(either(matchElse, matchEndIf), conti)
    const alter = slice(ind + 1, Infinity, conti)

    if (cmd === opcodes.OP_VERIFY) {
      const [x, ...s] = stack
      const st = x.toBN('le').isZero() ? 'invalid' : state
      return run({ stack: s, state: st, z }, conti)
    }

    if (cmd === opcodes.OP_IF) {
      const [x, ...s] = stack
      const p = !x.toBN('le').isZero() ? conti : alter
      return run({ stack: s, state, z }, p)
    }

    if (cmd === opcodes.OP_ELSE) {
      return run({ stack, state, z }, alter)
    }

    if (cmd === opcodes.OP_ENDIF) {
      return run({ stack, state, z }, conti)
    }
  }

  if (typeof cmd === 'number') {
    const fn = operator[cmd]
    return run({ stack: fn(stack), state, z }, conti)
  }

  if (Buffer.isBuffer(cmd)) {
    const data = cmd
    return run({ stack: [data, ...stack], state, z }, conti)
  }

  throw new Error(cmd)
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
