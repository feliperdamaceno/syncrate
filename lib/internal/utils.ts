import type { DeepCloneResult, DeepReadonly } from '@/internal/types'

export function deepClone<T>(value: T): DeepCloneResult<T> {
  if (value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) return value.map(deepClone)

  const clone = {} as { [key in keyof T]: T[keyof T] }

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      clone[key] = deepClone(value[key]) as T[keyof T]
    }
  }

  return clone
}

export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)

    Object.getOwnPropertyNames(value).forEach((key) => {
      return deepFreeze(value[key as keyof T])
    })
  }

  return value
}

export function isCustomEvent(event: Event): event is CustomEvent {
  return 'detail' in event
}
