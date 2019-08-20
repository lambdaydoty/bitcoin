module.exports = (hex) => {
  const parse = hex.replace(/(\n|\s)/mg, '')
  return Buffer.from(parse, 'hex')
}
