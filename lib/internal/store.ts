import type {
  Entries,
  EventOptions,
  InitialState,
  RecursivePartial,
  StateGetter,
  StateSetter,
  Store
} from '@/internal/types'

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
          detail: target[property as keyof T]
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

    set: (setter: StateSetter<RecursivePartial<T>>) => {
      const store = setter()
      const entries = Object.entries(store) as Entries<T>

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
