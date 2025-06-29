import type {
  DeepPartial,
  DeepReadonly,
  Entries,
  Indexable,
  Listener,
  Reader,
  Store,
  StoreOptions,
  Writer
} from '@/internal/types'

import { deepClone, deepFreeze } from '@/internal/utils'

const defaultStoreOptions: StoreOptions = {
  event: {
    bubbles: true,
    cancelable: true,
    composed: true
  }
}

export function defineStore<State extends Indexable>(
  name: string,
  state: State,
  options: StoreOptions = defaultStoreOptions
): Store<State> {
  const listeners = new Set<Listener>()

  function createProxyState<T extends Indexable>(state: T): T {
    return new Proxy(state, {
      get: (target, property, receiver) => {
        const value = Reflect.get(target, property, receiver)

        if (typeof value === 'object' && value !== null) {
          return createProxyState(value as Indexable)
        }

        return value
      },

      set: (target, property, value, receiver) => {
        const previous = target[property as keyof T]
        const hasChanged = Reflect.set(target, property, value, receiver)

        if (hasChanged && previous !== value) {
          const event = new CustomEvent(`syncrate:${name}`, {
            ...options,
            detail: target[property as keyof T]
          })

          document.dispatchEvent(event)
          listeners.forEach((listener) => listener())
        }

        return hasChanged
      }
    })
  }

  state = createProxyState(state)

  return {
    get: (reader: Reader<DeepReadonly<State>>) => {
      const listener = () => reader(deepFreeze(deepClone(state) as State))
      listener()

      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    set: (writer: Writer<DeepPartial<State>>) => {
      const store = writer(deepClone(state))
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
