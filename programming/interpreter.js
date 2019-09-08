const { isEmpty, either, slice, findIndex, isNil, both, propEq } = require('ramda')
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

  run(init, program)
}

function run (machine, program) {
  console.log({ machine, program })
  if (isEmpty(program)) return

  const { mainStack, altStack, state } = machine
  const [ [level, cmd], ...rest ] = program

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

  if (cmd === opcodes['OP_DUP']) {
    const x = mainStack.pop()
    mainStack.push(x)
    mainStack.push(x)
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
