import { afterEach, describe, expect, it, vi } from 'vitest'

import { defineStore } from '@/internal/store'
import { isCustomEvent } from '@/internal/utils'

describe('defineStore()', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should get existing state', () => {
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
    })

    const want = 'john'
    let got: string | undefined

    store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)
  })

  it('should throw error when trying to modify immutable state from get()', () => {
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
    })

    expect(() => {
      store.get((state) => {
        // @ts-expect-error: test only
        state.name = 'doe'
      })
    }).toThrowError()
  })

  it('should set new state', () => {
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
    })

    store.set(() => ({ name: 'doe' }))

    const want = 'doe'
    let got: string | undefined

    store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)
  })

  it('should retain unchanged state', () => {
    const store = defineStore({
      name: 'test',
      state: {
        unchanged: 'value',
        name: 'john'
      }
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
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
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
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
    })

    const want = 'john'
    let got: string | undefined

    const unsubscribe = store.get((state) => (got = state.name))
    expect(got).to.be.equal(want)

    unsubscribe()

    store.set(() => ({ name: 'doe' }))

    expect(got).to.be.equal(want)
  })

  it('should emit custom event when state changes', () => {
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
    })

    const handler = vi.fn()
    document.addEventListener('syncrate:test', handler)

    store.set(() => ({ name: 'doe' }))
    expect(handler).toBeCalled()
  })

  it('should send changed state in emitted custom event detail', () => {
    const store = defineStore({
      name: 'test',
      state: {
        name: 'john'
      }
    })

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

  it('should get initial state from storage on load when flags are enabled', () => {
    const key = 'test'
    const want = { name: 'doe' }

    expect(() => {
      const parsed = JSON.stringify(want)
      window.sessionStorage.setItem(key, parsed)
    }).not.toThrowError()

    const store = defineStore({
      name: key,
      state: {
        name: 'john'
      },
      options: {
        storage: {
          persist: true
        }
      }
    })

    let got: string | undefined = undefined

    store.get((state) => (got = state.name))

    expect(want.name).to.be.equal(got)
  })

  it('should persist data to "session" storage when flags are enabled', () => {
    type TestData = { name: string }

    const key = 'test'
    const store = defineStore({
      name: key,
      state: {
        name: 'john'
      },
      options: {
        storage: {
          persist: true
        }
      }
    })

    let want: TestData | undefined = undefined
    let got: string | undefined = undefined

    store.get((state) => (got = state.name))

    expect(() => {
      want = JSON.parse(
        window.sessionStorage.getItem(key) as string
      ) as TestData

      expect(want.name).to.be.equal(got)
    }).not.toThrowError()
  })

  it('should persist data to "local" storage when flags are enabled', () => {
    type TestData = { name: string }

    const key = 'test'
    const store = defineStore({
      name: key,
      state: {
        name: 'john'
      },
      options: {
        storage: {
          persist: true,
          type: 'local'
        }
      }
    })

    let want: TestData | undefined = undefined
    let got: string | undefined = undefined

    store.get((state) => (got = state.name))

    expect(() => {
      want = JSON.parse(window.localStorage.getItem(key) as string) as TestData

      expect(want.name).to.be.equal(got)
    }).not.toThrowError()
  })
})
