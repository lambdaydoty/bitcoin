const nToUInt8 = (n) => {
  const x = Buffer.alloc(1) // 8 / 8
  x.writeUInt8(n)
  return x
}

module.exports = nToUInt8
