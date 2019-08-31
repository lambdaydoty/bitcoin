module.exports = { hexToBE }

function hexToBE (hex, bits = 256) {
  const norm = hex
    .replace(/^0x/g, '')
    .replace(/(\n|\s)/mg, '')
    .padStart(bits / 4, '0')
  return Buffer.from(norm, 'hex')
}
