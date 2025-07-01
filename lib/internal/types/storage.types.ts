export type StorageType = 'session' | 'local'

export type StorageOptions = {
  persist?: boolean
  type?: StorageType
}
