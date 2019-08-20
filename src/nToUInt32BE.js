const nToUInt32LE = (n) => {
  const x = Buffer.alloc(4) // 32 / 8
  x.writeUInt32BE(n)
  return x
}

module.exports = nToUInt32LE
