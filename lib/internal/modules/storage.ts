import type { StorageType } from '@/internal/types/storage.types'

/**
 * @description A module that handles CRUD operations on either `sessionStorage` or `localStorage`.
 *
 * @param {StorageType} type [type = "session"] - describe the type of storage to be used, it can be either `session` or `local`.
 *
 */
export class StorageModule {
  #type: StorageType
  #storage: Storage

  constructor(type: StorageType = 'session') {
    this.#type = type

    switch (this.#type) {
      case 'session':
        this.#storage = window.sessionStorage
        break
      case 'local':
        this.#storage = window.localStorage
        break
      default:
        this.#storage = window.sessionStorage
    }
  }

  /**
   * @description Check whether a `key` is available in the storage.
   *
   * @param {string} key - storage `key`.
   * @returns {boolean} `true` if exist, `false` if not.
   */
  has(key: string): boolean {
    return this.#storage.getItem(key) !== null
  }

  /**
   * @description Get a `value` from storage with the given `key`.
   *
   * @param {string} key - storage `key`.
   * @returns {T} an array with `value` and possible `error`.
   */
  read<T>(key: string): [T, null] | [null, Error] {
    try {
      const storage = this.#storage.getItem(key)

      if (storage) {
        return [JSON.parse(storage), null]
      }

      throw new Error(`key "${key}" not found on ${this.#type} storage`)
    } catch (error) {
      if (error instanceof Error) {
        return [null, error]
      }

      throw error
    }
  }

  /**
   * @description Set a `value` from storage with the given `key`.
   *
   * @param {string} key - storage `key`.
   * @returns {boolean} `true` if written, `false` if not.
   */
  write<T>(key: string, value: T): boolean {
    try {
      const storage = JSON.stringify(value)
      this.#storage.setItem(key, storage)

      return this.has(key)
    } catch (error) {
      if (error instanceof Error) {
        return false
      }

      throw error
    }
  }

  /**
   * @description Delete a `value` from storage with the given `key`.
   *
   * @param {string} key - storage `key`.
   * @returns {boolean} `true` if deleted, `false` if not.
   */
  delete(key: string): boolean {
    this.#storage.removeItem(key)
    return !this.has(key)
  }
}
