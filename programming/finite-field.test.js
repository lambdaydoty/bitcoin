/* eslint-env jest */

const ff = require('./finite-field')
const BN = require('bignumber.js')

describe('', () => {
  const PRIME = 19
  const Field = ff(PRIME)
  const { bn, prime, inf, toBeField } = Field
  expect.extend({ toBeField })

  test('prime, inf', () => {
    expect(prime).toBeInstanceOf(BN)
    expect(inf).toBeInstanceOf(BN)
    expect(prime).not.toBeInstanceOf(Field)
    expect(inf).not.toBeInstanceOf(Field)
    expect(prime.toNumber()).toBe(PRIME)
    expect(inf.toString()).toBe('Infinity')
  })

  test('elements', () => {
    function element (val) {
      const x = bn(val)
      expect(x).toBeInstanceOf(BN)
      expect(x).toBeInstanceOf(Field)
      expect(x.isFF()).toBe(true)
      expect(x.eq(x)).toBe(true)
      expect(x.neq(x)).toBe(false)
      expect(bn(x)).toBeField(x)
      expect(x).toBeField(bn(new BN(x.toNumber()).plus(PRIME)))
      expect(x).toBeField(bn(new BN(x.toNumber()).plus(PRIME).plus(PRIME)))
      expect(x).toBeField(bn(new BN(x.toNumber()).minus(PRIME)))
    }
    element(0)
    element(1)
    element(2)
    element(3)
    element(4)
    element(5)
    element(6)
    element(7)
    element(8)
    element(9)
    element('a')
    element('b')
    element('c')
    element('d')
    element('e')
    element('f')
    element('10')
    element('11')
    element('12')
    element('13')
  })

})
