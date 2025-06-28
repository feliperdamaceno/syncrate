import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineStore } from '@/internal/store'

describe('defineStore', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should get existing state', () => {
    const store = defineStore('test', () => ({ name: 'john' }))

    const want = 'john'
    const got = store.get((state) => state.name)
    expect(got).to.be.equal(want)
  })

  it('should set new state', () => {
    const store = defineStore('test', () => ({ name: 'john' }))
    store.set(() => ({ name: 'doe' }))

    const got = store.get((state) => state.name)
    const want = 'doe'
    expect(got).to.be.equal(want)
  })

  it('should retain unchanged state', () => {
    const store = defineStore('test', () => ({
      unchanged: 'value',
      name: 'john'
    }))

    store.set(() => ({ name: 'doe' }))

    const want = 'value'
    const got = store.get((state) => state.unchanged)
    expect(got).to.be.equal(want)
  })

  it('should emit custom event when state changes', () => {
    const store = defineStore('test', () => ({ name: 'john' }))

    const handler = vi.fn()
    document.addEventListener('syncrate:test', handler)

    store.set(() => ({ name: 'doe' }))
    expect(handler).toBeCalled()
  })
})
