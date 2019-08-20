Object
  .getPrototypeOf(function * () {})
  .prototype
  .map = function * (mapper, thisArg) {
    for (const x of this) {
      yield mapper.call(thisArg, x)
    }
  }

function * nat () {
  let i = 0
  while (true) {
    yield i++
  }
}

module.exports = { nat }
