import { describe, expect, it } from 'vitest'

import { StorageModule } from '@/internal/modules/storage'

describe('StorageModule', () => {
  it('should check if value exist on "session" storage', () => {
    const session = new StorageModule('session')
    const key = 'test'

    session.write(key, 'value')

    const want = true
    const got = session.has(key)

    expect(got).to.be.equal(want)
  })

  it('should write and read value to "session" storage', () => {
    const session = new StorageModule('session')
    const key = 'test'

    const want = 'value'
    session.write(key, want)

    const [got, error] = session.read<string>(key)

    expect(error).to.be.equal(null)
    expect(got).to.be.equal(want)

    let storage: string | undefined = undefined

    expect(() => {
      storage = JSON.parse(window.sessionStorage.getItem(key) as string)
    }).not.toThrowError()

    expect(storage).to.be.equal(want)
  })

  it('should delete value to "session" storage', () => {
    const session = new StorageModule('session')
    const key = 'test'

    session.write(key, 'value')

    const want = true
    const got = session.delete(key)

    expect(got).to.be.equal(want)
    expect(session.has(key)).to.be.equal(false)
  })

  it('should check if value exist on "local" storage', () => {
    const session = new StorageModule('local')
    const key = 'test'

    session.write(key, 'value')

    const want = true
    const got = session.has(key)

    expect(got).to.be.equal(want)
  })

  it('should write and read value to "local" storage', () => {
    const session = new StorageModule('local')
    const key = 'test'

    const want = 'value'
    session.write(key, want)

    const [got, error] = session.read<string>(key)

    expect(error).to.be.equal(null)
    expect(got).to.be.equal(want)

    let storage: string | undefined = undefined

    expect(() => {
      storage = JSON.parse(window.localStorage.getItem(key) as string)
    }).not.toThrowError()

    expect(storage).to.be.equal(want)
  })

  it('should delete value to "local" local', () => {
    const session = new StorageModule('local')
    const key = 'test'

    session.write(key, 'value')

    const want = true
    const got = session.delete(key)

    expect(got).to.be.equal(want)
    expect(session.has(key)).to.be.equal(false)
  })
})
