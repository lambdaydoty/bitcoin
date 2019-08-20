module.exports = (b) => b
  .toString('hex')
  .match(/../g)
  .reverse()
  .join('')
