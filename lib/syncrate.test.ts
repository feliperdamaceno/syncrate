import { describe, expect, it } from 'vitest'

import { example } from '@/syncrate'

describe('example', () => {
  it('should return the speficied param', () => {
    const want = 'test'
    const got = example('test')
    expect(got).to.be.equal(want)
  })
})
