import { beforeAll, describe, expect, it } from 'vitest'

import {
  deepClone,
  deepFreeze,
  isCustomEvent,
  isObject
} from '@/internal/utils'

describe('isCustomEvent()', () => {
  let custom: CustomEvent<{ test: string }>

  beforeAll(() => {
    custom = new CustomEvent('test:custom', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: { test: 'value' }
    })
  })

  it('should return "true" when the event has "detail" property', () => {
    const want = true
    let got = false

    document.addEventListener('test:custom', (event) => {
      got = isCustomEvent(event)
    })

    document.dispatchEvent(custom)
    expect(got).to.be.equal(want)
  })

  it('should return "false" when the event does not have "detail" property', () => {
    const want = false
    let got: boolean = false

    document.addEventListener('DOMContentLoaded', (event) => {
      got = isCustomEvent(event)
    })

    document.dispatchEvent(custom)
    expect(got).to.be.equal(want)
  })
})

describe('isObject()', () => {
  it('should return "true" for objects', () => {
    expect(isObject({})).to.be.equal(true)
    expect(isObject(new (class Test {})())).to.be.equal(true)
    expect(isObject(new Map())).to.be.equal(true)
    expect(isObject(new Set())).to.be.equal(true)
    expect(isObject(new WeakMap())).to.be.equal(true)
    expect(isObject(new WeakSet())).to.be.equal(true)
    expect(isObject(new WeakRef({}))).to.be.equal(true)
    expect(isObject(new Proxy({}, {}))).to.be.equal(true)
    expect(isObject(new Date())).to.be.equal(true)
  })

  it('should return "false" for non objects', () => {
    expect(isObject([])).to.be.equal(false)
    expect(isObject(Symbol('a'))).to.be.equal(false)
    expect(isObject('a')).to.be.equal(false)
    expect(isObject(BigInt(1))).to.be.equal(false)
    expect(isObject(1)).to.be.equal(false)
    expect(isObject(1.0)).to.be.equal(false)
    expect(isObject(true)).to.be.equal(false)
    expect(isObject(false)).to.be.equal(false)
    expect(isObject(undefined)).to.be.equal(false)
    expect(isObject(null)).to.be.equal(false)
    expect(isObject(function test() {})).to.be.equal(false)
    expect(isObject(() => {})).to.be.equal(false)
  })
})

describe('deepClone()', () => {
  it('should clone "Map"', () => {
    const want = new Map([
      [0, 'first'],
      [1, 'second']
    ])
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got).to.be.instanceof(Map)
    want.forEach((value, key) => expect(value).toEqual(got.get(key)))
  })

  it('should clone "Set"', () => {
    const want = new Set([1, 'a', true])
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got.size).to.be.equal(want.size)
    expect(Array.from(got)[0]).to.be.equal(Array.from(want)[0])
    expect(Array.from(got)[1]).to.be.equal(Array.from(want)[1])
    expect(Array.from(got)[2]).to.be.equal(Array.from(want)[2])
  })

  it('should clone "Date"', () => {
    const want = new Date()
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got).to.be.instanceof(Date)
    expect(got.getTime()).to.be.equal(want.getTime())
  })

  it('should clone "RegExp"', () => {
    const want = /test/g
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got.test('test')).to.be.equal(want.test('test'))
  })

  it('should clone "Array"', () => {
    const want = [1, 'a', true]
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got).to.have.length(want.length)
    expect(got[0]).to.be.equal(want[0])
    expect(got[1]).to.be.equal(want[1])
    expect(got[2]).to.be.equal(want[2])
  })

  it('should clone "Object"', () => {
    const want = { first: { second: { third: 'value' } } }
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got.first.second.third).to.be.equal(want.first.second.third)
  })

  it('should clone "Proxy"', () => {
    const want = new Proxy({ test: 'value' }, {})
    const got = deepClone(want)

    expect(got).to.not.be.equal(want)
    expect(got.test).to.be.equal(want.test)
  })

  it('should clone "Function"', () => {
    const want = function () {
      return 'value'
    }
    const got = deepClone(want)

    expect(got()).to.be.equal(want())
  })

  it('should clone "Arrow Function"', () => {
    const want = () => 'value'
    const got = deepClone(want)

    expect(got()).to.be.equal(want())
  })

  it('should clone "Primitives"', () => {
    const want = {
      ['number']: 1,
      ['float']: 1.0,
      ['string']: 'a',
      ['boolean']: true,
      ['undefined']: undefined,
      ['null']: null,
      ['Symbol']: Symbol('a'),
      ['BigInt']: BigInt(1)
    }
    const got = deepClone(want)

    expect(got['number']).to.be.equal(want['number'])
    expect(got['float']).to.be.equal(want['float'])
    expect(got['string']).to.be.equal(want['string'])
    expect(got['boolean']).to.be.equal(want['boolean'])
    expect(got['undefined']).to.be.equal(want['undefined'])
    expect(got['null']).to.be.equal(want['null'])
    expect(got['Symbol']).to.be.equal(want['Symbol'])
    expect(got['BigInt']).to.be.equal(want['BigInt'])
  })
})

describe('deepFreeze()', () => {
  it('should feeze all properties in deeply nested object', () => {
    const want = {
      first: {
        second: {
          third: {
            ['number']: 1,
            ['float']: 1.0,
            ['string']: 'a',
            ['boolean']: true,
            ['undefined']: undefined,
            ['null']: null,
            ['Symbol']: Symbol('a'),
            ['BigInt']: BigInt(1)
          }
        }
      }
    }
    const got = deepFreeze(want)

    expect(() => {
      // @ts-expect-error: test only
      got.first = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['number'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['float'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['string'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['boolean'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['undefined'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['null'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['Symbol'] = 'value'
    }).toThrowError()

    expect(() => {
      // @ts-expect-error: test only
      got.first.second.third['BigInt'] = 'value'
    }).toThrowError()
  })
})
