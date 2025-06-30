/*
  Customization and Configuration
*/

export type StorageType = 'session' | 'local'

export type StorageOptions = {
  persist: boolean
  type: StorageType
}

export type EventOptions = {
  bubbles?: boolean
  cancelable?: boolean
  composed?: boolean
}

export type StoreOptions = {
  storage: StorageOptions
  event: EventOptions
}
