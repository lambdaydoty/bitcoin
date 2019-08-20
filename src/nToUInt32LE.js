const nToUInt32LE = (n) => {
  const x = Buffer.alloc(4) // 32 / 8
  x.writeUInt32LE(n)
  return x
}

// console.log(
//   nToUInt32LE(1)
// )

module.exports = nToUInt32LE
