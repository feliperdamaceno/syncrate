import type {
  DeepReadonly,
  Entries,
  Indexable
} from '@/internal/types/helper.types'
import type {
  Listener,
  Reader,
  Store,
  StoreDefinition,
  StoreOptions,
  Unsubscriber,
  Writer
} from '@/internal/types/store.types'

import { StorageModule } from '@/internal/modules/storage'
import { deepClone, deepFreeze, isObject } from '@/internal/utils'

const defaultStoreOptions: StoreOptions = {
  storage: {
    persist: false,
    type: 'session'
  },
  event: {
    bubbles: true,
    cancelable: true,
    composed: true
  }
}

/**
 * @description Creates a reactive store with methods to retrieve and update `state`.
 *
 * @param {Object} definition - properties used to define the store.
 * @returns {Store<T>} store `proxy` object with `get` and a `set` methods.
 */
export function defineStore<State extends Indexable<State>>({
  name,
  state,
  options = defaultStoreOptions
}: StoreDefinition<State>): Store<State> {
  const listeners = new Set<Listener<State>>()
  let storage: StorageModule | null = null

  if (options?.storage?.persist) {
    storage = new StorageModule(options.storage.type)
  }

  /**
   * Helper to create a reactive `proxy` object.
   */
  function createProxy<T extends Indexable<T>>(value: T): T {
    return new Proxy(value, {
      get: (target, property, receiver) => {
        const result = Reflect.get(target, property, receiver)

        if (isObject(result)) return createProxy(result)

        return result
      },

      set: (target, property, value, receiver) => {
        const result = target[property as keyof T]
        const hasChanged = Reflect.set(target, property, value, receiver)

        if (hasChanged && result !== value) {
          const event = new CustomEvent(`syncrate:${name}`, {
            ...options.event,
            detail: target[property as keyof T]
          })

          document.dispatchEvent(event)
          listeners.forEach((listener) => listener(target))
        }

        return hasChanged
      }
    })
  }

  /**
   * Helper to handle whether the `state` will be persistent withing `sessionStorage` or `localStorage`.
   */
  function handlePersistency(): State {
    if (storage && storage.has(name)) {
      const [cache, error] = storage.read<State>(name)

      if (cache && !error) {
        return createProxy(cache)
      }
    }

    const proxy = createProxy(state)

    if (storage) {
      storage.write(name, proxy)
    }

    return proxy
  }

  /**
   * The store `state` proxy object.
   */
  const store = handlePersistency()

  /**
   * @description Method used to access the store `state`. It accepts a reader `callback` which contains the `state` as first param. The `reader` is also subscribed into an internal listener mapping, which will notify all `readers` whenever the store changes.
   *
   * @param {Function} reader - `callback` function that receive the `state` as first param.
   * @returns {Function} `callback` used to unsubscribe the `reader`.
   */
  const get = (reader: Reader<DeepReadonly<State>>): Unsubscriber => {
    const listener: Listener<State> = (state) => {
      const snapshot = deepFreeze(deepClone(state))
      reader(snapshot)
    }

    listener(store)

    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  /**
   * @description Method used to update the store `state`. It accepts a writer `callback` which contains the `state` as first param. Calling the `set` method will trigger a notification to all `readers`.
   *
   * @param {Function} writer - `callback` function that receive the `state` as first param.
   */
  const set = (writer: Writer<State>): void => {
    const snapshot = deepClone(store)
    const updates = Object.entries(writer(snapshot)) as Entries<State>

    updates.forEach(([key, value]) => {
      if (Object.hasOwn(store, key)) {
        return (store[key] = value)
      }

      const error = `key "${String(key)}" does not exist on store "${name}"`
      console.error(error)
    })

    if (storage) {
      storage.write(name, deepClone(store))
    }
  }

  return { get, set }
}
