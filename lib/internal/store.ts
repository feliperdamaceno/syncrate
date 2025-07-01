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
  const listeners = new Set<Listener<State>>()

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

  const proxy = createProxy(state)

  return {
    get: (reader: Reader<DeepReadonly<State>>) => {
      const listener: Listener<State> = (state) => {
        const snapshot = deepFreeze(deepClone(state))
        reader(snapshot)
      }

      listener(proxy)

      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    set: (writer: Writer<DeepPartial<State>>) => {
      const snapshot = deepClone(proxy)
      const updates = Object.entries(writer(snapshot)) as Entries<State>

      updates.forEach(([key, value]) => {
        if (Object.hasOwn(proxy, key)) {
          return (proxy[key] = value)
        }

        const error = `key "${String(key)}" does not exist on store "${name}"`
        console.error(error)
      })
    }
  }
}
