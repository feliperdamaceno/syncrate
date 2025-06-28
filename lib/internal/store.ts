type InitialState = { [key: string]: unknown }
type StateGetter<T> = (state: T) => T[keyof T]
type StateSetter<T> = () => T

type Store<T> = {
  get: (getter: StateGetter<T>) => T[keyof T]
  set: (setter: StateSetter<Partial<T>>) => void
}

type StoreEntries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

type EventOptions = {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}

export function defineStore<T extends InitialState>(
  key: string,
  setter: StateSetter<T>,
  options: EventOptions = { bubbles: true, cancelable: true, composed: true }
): Store<T> {
  const listeners = new Set<StateGetter<T>>()

  const state = new Proxy(setter(), {
    get: (target, property, receiver): T[keyof T] => {
      return Reflect.get(target, property, receiver)
    },

    set: (target, property, value, receiver) => {
      const previous = target[property as keyof T]
      const success = Reflect.set(target, property, value, receiver)

      if (success && previous !== value) {
        const event = new CustomEvent(`syncrate:${key}`, options)
        document.dispatchEvent(event)
        listeners.forEach((listener) => {
          console.log('value updated')
          listener(value)
        })
      }

      return success
    }
  })

  return {
    get: (getter: StateGetter<T>) => {
      if (!listeners.has(getter)) listeners.add(getter)
      return getter(state)
    },
    set: (setter: StateSetter<Partial<T>>) => {
      const store = setter()
      const entries = Object.entries(store) as StoreEntries<T>
      entries.forEach(([key, value]) => {
        state[key] = value
      })
    }
  }
}
