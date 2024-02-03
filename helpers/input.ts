import { Http400 } from 'helpers/http'

type ValidType = 'string' | 'number' | 'boolean' | 'object' | undefined

interface Validation {
  type?: ValidType
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  notnull?: boolean
}

interface ValidationMessage {
  type?: string
  required?: string
  min?: string
  max?: string
  minLength?: string
  maxLength?: string
  pattern?: string
  notnull?: boolean
}

export function Field(validation?: Validation) {
  // deno-lint-ignore no-explicit-any
  return function (target: any, propertyKey: string) {
    if (validation === undefined) return
    if (validation.required !== undefined) {
      Reflect.defineMetadata(
        'required',
        validation.required,
        target,
        propertyKey
      )
      Reflect.defineMetadata(
        'notnull',
        validation.required,
        target,
        propertyKey
      )
    }
    if (validation.notnull !== undefined) {
      Reflect.defineMetadata('notnull', validation.notnull, target, propertyKey)
    }
    if (validation.type !== undefined) {
      Reflect.defineMetadata('type', validation.type, target, propertyKey)
    }
    if (validation.min !== undefined) {
      Reflect.defineMetadata('min', validation.min, target, propertyKey)
    }
    if (validation.max !== undefined) {
      Reflect.defineMetadata('max', validation.max, target, propertyKey)
    }
    if (validation.minLength !== undefined) {
      Reflect.defineMetadata(
        'minLength',
        validation.minLength,
        target,
        propertyKey
      )
    }
    if (validation.maxLength !== undefined) {
      Reflect.defineMetadata(
        'maxLength',
        validation.maxLength,
        target,
        propertyKey
      )
    }
    if (validation.pattern !== undefined) {
      Reflect.defineMetadata('pattern', validation.pattern, target, propertyKey)
    }
    if (!Reflect.hasMetadata('fields', target)) {
      Reflect.defineMetadata('fields', [], target)
    }
    Reflect.getMetadata<string[]>('fields', target).push(propertyKey)
  }
}

export function Message(validationMessage: ValidationMessage) {
  // deno-lint-ignore no-explicit-any
  return function (target: any, propertyKey: string) {
    if (validationMessage.type !== undefined) {
      Reflect.defineMetadata(
        'msg:type',
        validationMessage.type,
        target,
        propertyKey
      )
    }
    if (validationMessage.required !== undefined) {
      Reflect.defineMetadata(
        'msg:required',
        validationMessage.required,
        target,
        propertyKey
      )
    }
    if (validationMessage.min !== undefined) {
      Reflect.defineMetadata(
        'msg:min',
        validationMessage.min,
        target,
        propertyKey
      )
    }
    if (validationMessage.max !== undefined) {
      Reflect.defineMetadata(
        'msg:max',
        validationMessage.max,
        target,
        propertyKey
      )
    }
    if (validationMessage.minLength !== undefined) {
      Reflect.defineMetadata(
        'msg:minLength',
        validationMessage.minLength,
        target,
        propertyKey
      )
    }
    if (validationMessage.maxLength !== undefined) {
      Reflect.defineMetadata(
        'msg:maxLength',
        validationMessage.maxLength,
        target,
        propertyKey
      )
    }
    if (validationMessage.pattern !== undefined) {
      Reflect.defineMetadata(
        'msg:pattern',
        validationMessage.pattern,
        target,
        propertyKey
      )
    }
    if (validationMessage.notnull !== undefined) {
      Reflect.defineMetadata(
        'msg:notnull',
        validationMessage.notnull,
        target,
        propertyKey
      )
    }
  }
}

function checkType(type: ValidType, value: any) {
  switch (type) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return !isNaN(Number(value))
    case 'boolean':
      return value === 'true' || value === 'false'
    case 'object':
      return typeof value === 'object'
    default:
      return true
  }
}

// deno-lint-ignore no-explicit-any
export function validateInput(target: any, data: Dict = {}) {
  const fields = Reflect.getMetadata<string[]>('fields', target)
  for (const field of fields) {
    const value = data[field]

    const type = Reflect.getMetadata<ValidType | undefined>(
      'type',
      target,
      field
    )
    const required = Reflect.getMetadata<boolean | undefined>(
      'required',
      target,
      field
    )
    const min = Reflect.getMetadata<number | undefined>('min', target, field)
    const max = Reflect.getMetadata<number | undefined>('max', target, field)
    const minLength = Reflect.getMetadata<number | undefined>(
      'minLength',
      target,
      field
    )
    const maxLength = Reflect.getMetadata<number | undefined>(
      'maxLength',
      target,
      field
    )
    const pattern = Reflect.getMetadata<RegExp | undefined>(
      'pattern',
      target,
      field
    )
    const notnull = Reflect.getMetadata<boolean | undefined>(
      'notnull',
      target,
      field
    )

    if (value === undefined) {
      if (required) {
        throw new Http400(
          400,
          Reflect.getMetadata('msg:required', target, field) ||
            `Parameter ${field} must be provided.`
        )
      }
    } else if (value === null) {
      // Handle null.
      if (notnull) {
        throw new Http400(
          400,
          Reflect.getMetadata('msg:notnull', target, field) ||
            `Parameter ${field} can not be null.`
        )
      } else {
        Object.defineProperty(target, field, { value, enumerable: true })
      }
    } else if (type && !checkType(type, value)) {
      throw new Http400(
        400,
        Reflect.getMetadata('msg:type', target, field) ||
          `Illegal type of parameter ${field}.`
      )
    } else if (
      min !== undefined &&
      (typeof value !== 'number' || value < min)
    ) {
      throw new Http400(
        400,
        Reflect.getMetadata('msg:min', target, field) ||
          `The minimum of parameter ${field} is ${min}.`
      )
    } else if (
      max !== undefined &&
      (typeof value !== 'number' || value > max)
    ) {
      throw new Http400(
        400,
        Reflect.getMetadata('msg:max', target, field) ||
          `The maximum of parameter ${field} is ${max}.`
      )
    } else if (
      minLength !== undefined &&
      (typeof value !== 'string' || value.length < minLength)
    ) {
      throw new Http400(
        400,
        Reflect.getMetadata('msg:minLength', target, field) ||
          `The minimum length of parameter ${field} is ${minLength}.`
      )
    } else if (
      maxLength !== undefined &&
      (typeof value !== 'string' || value.length > maxLength)
    ) {
      throw new Http400(
        400,
        Reflect.getMetadata('msg:maxLength', target, field) ||
          `The maximum length of parameter ${field} is ${maxLength}.`
      )
    } else if (pattern && !pattern.test(value)) {
      throw new Http400(
        400,
        Reflect.getMetadata('msg:pattern', target, field) ||
          `Parameter ${field} fails the regular expression verification.`
      )
    } else {
      target[field] = value
    }
  }
}

class Input {
  constructor() {}

  valueOf() {
    const descriptors = Object.getOwnPropertyDescriptors(this)
    return Object.keys(descriptors).reduce((pre, key) => {
      pre[key] = descriptors[key].value
      return pre
    }, {} as Dict)
  }
}

export const requiredStringField = Field({ type: 'string', required: true })
export const requiredObjectField = Field({ type: 'object', required: true })

export default Input
