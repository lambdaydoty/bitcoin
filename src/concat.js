const { curryN } = require('ramda')

module.exports = curryN(
  2,
  (x, y) => Buffer.concat([x, y]),
)
