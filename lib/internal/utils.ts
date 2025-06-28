export function isCustomEvent(event: Event): event is CustomEvent {
  return 'detail' in event
}

export function deepClone<T>(
  value: T
): T | T[] | { [key in keyof T]: T[keyof T] } {
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
