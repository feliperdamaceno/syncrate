import type {
  DeepPartial,
  DeepReadonly,
  Entries,
  Indexable
} from '@/internal/types/helper.types'
import type {
  Listener,
  Reader,
  Store,
  StoreOptions,
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

export function defineStore<State extends Indexable<State>>(
  name: string,
  state: State,
  options: StoreOptions = defaultStoreOptions
): Store<State> {
  const listeners = new Set<Listener<State>>()
  let storage: StorageModule | null = null

  if (options.storage.persist) {
    storage = new StorageModule(options.storage.type)
  }

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

  const store = handlePersistency()

  return {
    get: (reader: Reader<DeepReadonly<State>>) => {
      const listener: Listener<State> = (state) => {
        const snapshot = deepFreeze(deepClone(state))
        reader(snapshot)
      }

      listener(store)

      listeners.add(listener)
      return () => {
        listeners.delete(listener)

        if (storage && listeners.size === 0) {
          storage.delete(name)
        }
      }
    },

    set: (writer: Writer<DeepPartial<State>>) => {
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
  }
}
