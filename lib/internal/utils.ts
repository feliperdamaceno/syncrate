import type { DeepReadonly, Indexable } from '@/internal/types/helper.types'

export function isCustomEvent(event: Event): event is CustomEvent {
  return 'detail' in event
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(deepClone) as unknown as T
  }

  if (isObject(value)) {
    const clone = {} as Indexable<T>

    for (const key in value) {
      if (Object.hasOwn(value, key)) {
        const property = value[key]
        clone[key] = deepClone(property)
      }
    }

    return clone
  }

  return value
}

export function deepFreeze<T extends Indexable<T>>(value: T): DeepReadonly<T> {
  if (isObject(value) && !Object.isFrozen(value)) {
    Object.freeze(value)

    for (const key in value) {
      if (Object.hasOwn(value, key)) {
        deepFreeze(value[key])
      }
    }
  }

  return value
}
