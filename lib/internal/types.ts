export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

export type InitialState = { [key: string]: unknown }
export type StateGetter<T> = (state: T) => T[keyof T]
export type StateSetter<T> = () => T

export type Store<T> = {
  get: (getter: StateGetter<T>) => T[keyof T]
  set: (setter: StateSetter<RecursivePartial<T>>) => void
}

export type EventOptions = {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}
