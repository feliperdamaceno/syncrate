export type Indexable<T> = { [K in keyof T]: T[K] }

export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

export type DeepReadonly<T> = Readonly<{
  [K in keyof T]: T[K] extends number | string | symbol
    ? Readonly<T[K]>
    : Readonly<DeepReadonly<T[K]>>
}>

export type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>
}
