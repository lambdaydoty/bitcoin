module.exports = (hex) => {
  const reversed = hex
    .match(/../g)
    .reverse()
    .join('')
  return Buffer.from(reversed, 'hex')
}
