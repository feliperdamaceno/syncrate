import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineStore } from '@/internal/store'
import { isCustomEvent } from '@/internal/utils'

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

    const want = 'value'
    let got = store.get((state) => state.unchanged)
    expect(got).to.be.equal(want)

    store.set(() => ({ name: 'doe' }))

    got = store.get((state) => state.unchanged)
    expect(got).to.be.equal(want)
  })

  it('should not set keys that are not in the original state', () => {
    const store = defineStore('test', () => ({
      name: 'john'
    }))

    // @ts-expect-error: test only
    store.set(() => ({ age: 25 }))

    let want: string | undefined = undefined
    // @ts-expect-error: test only
    let got = store.get((state) => state.age)
    expect(got).to.be.equal(want)

    want = 'john'
    got = store.get((state) => state.name)
    expect(got).to.be.equal(want)
  })

  it('should emit custom event when state changes', () => {
    const store = defineStore('test', () => ({ name: 'john' }))

    const handler = vi.fn()
    document.addEventListener('syncrate:test', handler)

    store.set(() => ({ name: 'doe' }))
    expect(handler).toBeCalled()
  })

  it('should send changed state in emitted custom event detail when state changes', () => {
    const store = defineStore('test', () => ({ name: 'john' }))

    const want = 'doe'
    let got: string | undefined

    document.addEventListener('syncrate:test', (event) => {
      if (isCustomEvent(event)) {
        got = event.detail
      }
    })

    store.set(() => ({ name: 'doe' }))
    expect(got).to.be.equal(want)
  })
})
