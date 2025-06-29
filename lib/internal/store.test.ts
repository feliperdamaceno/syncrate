import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineStore } from '@/internal/store'

describe('defineStore', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should get existing state', () => {
    const store = defineStore('test', { name: 'john' })

    const want = 'john'
    let got: string | undefined

    store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)
  })

  it('should set new state', () => {
    const store = defineStore('test', { name: 'john' })
    store.set(() => ({ name: 'doe' }))

    const want = 'doe'
    let got: string | undefined

    store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)
  })

  it('should retain unchanged state', () => {
    const store = defineStore('test', {
      unchanged: 'value',
      name: 'john'
    })

    const want = 'value'
    let got: string | undefined

    store.get((state) => (got = state.unchanged))
    expect(got).to.be.equal(want)

    store.set(() => ({ name: 'doe' }))

    store.get((state) => (got = state.unchanged))
    expect(got).to.be.equal(want)
  })

  it('should not set keys that are not in the original state', () => {
    const store = defineStore('test', {
      name: 'john'
    })

    // @ts-expect-error: test only
    store.set(() => ({ age: 25 }))

    let want: string | undefined = undefined
    let got: string | undefined

    // @ts-expect-error: test only
    store.get((state) => (got = state.age))
    expect(got).to.be.equal(want)

    want = 'john'
    store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)
  })

  it('should allow unsubscribe to store changes', () => {
    const store = defineStore('test', { name: 'john' })

    const want = 'john'
    let got: string | undefined

    const unsubscribe = store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)

    unsubscribe()

    store.set(() => ({ name: 'doe' }))

    expect(got).to.be.equal(want)
  })
})
