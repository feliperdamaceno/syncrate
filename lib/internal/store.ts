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
  const listeners = new Set<Listener>()

  function createProxy<T extends Indexable<T>>(value: T): T {
    return new Proxy(value, {
      get: (target, property, receiver) => {
        const value = Reflect.get(target, property, receiver)

        if (isObject(value) && value !== null) {
          return createProxy(value as { [K: string]: unknown })
        }

        return value
      },

      set: (target, property, value, receiver) => {
        const previous = target[property as keyof T]
        const hasChanged = Reflect.set(target, property, value, receiver)

        if (hasChanged && previous !== value) {
          const event = new CustomEvent(`syncrate:${name}`, {
            ...options.event,
            detail: target[property as keyof T]
          })

          document.dispatchEvent(event)
          listeners.forEach((listener) => listener())
        }

        return hasChanged
      }
    })
  }

  state = createProxy(state)

  return {
    get: (reader: Reader<DeepReadonly<State>>) => {
      const listener = () => reader(deepFreeze(deepClone(state)))
      listener()

      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    set: (writer: Writer<DeepPartial<State>>) => {
      const store = writer(state)
      const entries = Object.entries(store) as Entries<State>

      entries.forEach(([key, value]) => {
        if (Object.keys(state).includes(String(key))) {
          return (state[key] = value)
        }

        const error = `key "${String(key)}" does not exist on store "${name}"`
        return console.error(error)
      })
    }
  }
}
