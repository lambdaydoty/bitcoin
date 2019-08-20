module.exports = (hex) => {
  const reversed = hex
    .padStart(256 / 8 * 2)
    .match(/../g)
    .reverse()
    .join('')
  return Buffer.from(reversed, 'hex')
}
