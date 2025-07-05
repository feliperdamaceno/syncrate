import type { EventOptions } from '@/internal/types/event.types'
import type { DeepReadonly } from '@/internal/types/helper.types'
import type { StorageOptions } from '@/internal/types/storage.types'

export type Listener<State> = (state: State) => void
export type Unsubscriber = () => void

export type Reader<State> = (state: State) => void
export type Writer<State> = (state: State) => Partial<State>

export type StoreOptions = {
  storage?: StorageOptions
  event?: EventOptions
}

export type Store<State> = {
  get: (reader: Reader<DeepReadonly<State>>) => Unsubscriber
  set: (writer: Writer<State>) => void
}

export interface StoreDefinition<State> {
  name: string
  state: State
  options?: StoreOptions
}
