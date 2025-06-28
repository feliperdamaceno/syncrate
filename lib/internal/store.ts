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
  name: string,
  setter: StateSetter<T>,
  options: EventOptions = { bubbles: true, cancelable: true, composed: true }
): Store<T> {
  const state = new Proxy(setter(), {
    get: (target, property, receiver): T[keyof T] => {
      return Reflect.get(target, property, receiver)
    },

    set: (target, property, value, receiver) => {
      const previous = target[property as keyof T]
      const hasChanged = Reflect.set(target, property, value, receiver)

      if (hasChanged && previous !== value) {
        const event = new CustomEvent(`syncrate:${name}`, {
          ...options,
          detail: state[property as keyof T]
        })
        document.dispatchEvent(event)
      }

      return hasChanged
    }
  })

  return {
    get: (getter: StateGetter<T>) => {
      return getter(state)
    },

    set: (setter: StateSetter<Partial<T>>) => {
      const store = setter()
      const entries = Object.entries(store) as StoreEntries<T>

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
