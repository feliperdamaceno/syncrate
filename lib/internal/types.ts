export type DeepReadonly<T> = Readonly<{
  [K in keyof T]: T[K] extends number | string | symbol
    ? Readonly<T[K]>
    : Readonly<DeepReadonly<T[K]>>
}>

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type DeepCloneResult<T> = T | T[] | { [key in keyof T]: T[keyof T] }

export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

export type Indexable = { [key: string]: unknown }

export type Listener = () => void
export type Unsubscriber = () => void

export type Reader<State> = (state: State) => void
export type Writer<State> = (state?: State) => State

export type EventDetails = {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}

export type StoreOptions = {
  event: EventDetails
}

export type Store<State> = {
  get: (reader: Reader<DeepReadonly<State>>) => Unsubscriber
  set: (writer: Writer<DeepPartial<State>>) => void
}
