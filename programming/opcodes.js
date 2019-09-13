module.exports = {
  // OP_0: 0x00, // 0
  // OP_1: 0x51, // 81
  // OP_6: 0x56, // 86
  // OP_PUSHDATA1,
  // OP_PUSHDATA2,
  // OP_PUSHDATA4,

  OP_NOP: 0x61, // 97
  OP_IF: 0x63, // 99
  OP_NOTIF: 0x64, // 100
  OP_ELSE: 0x67, // 103
  OP_ENDIF: 0x68, // 104
  OP_VERIFY: 0x69, // 105
  OP_RETURN: 0x6a, // 106

  OP_TOALTSTACK: 0x6b, // 107
  OP_FROMALTSTACK: 0x6c, // 108

  OP_SWAP: 0x7c, // 124
  OP_2DUP: 0x6e, // 110
  OP_DUP: 0x76, // 118

  OP_EQUAL: 0x87, // 135
  OP_EQUALVERIFY: 0x88, // 136

  OP_1ADD: 0x8b, // 139
  OP_1SUB: 0x8c, // 140
  OP_NOT: 0x91, // 145
  OP_ADD: 0x93, // 147
  OP_SUB: 0x94, // 148
  OP_MUL: 0x95, // 149

  OP_RIPEMD160: 0xa6, // 166
  OP_SHA1: 0xa7, // 167
  OP_SHA256: 0xa8, // 168
  OP_HASH160: 0xa9, // 169
  OP_HASH256: 0xaa, // 170

  OP_CHECKSIG: 0xac, // 172
  OP_CHECKSIGVERIFY: 0xac, // 173
  OP_CHECKMULTISIG: 0xae, // 174
  OP_CHECKMULTISIGVERIFY: 0xaf, // 175
}
