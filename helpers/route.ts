import { validateInput } from 'helpers/input'

import { Http404, Http500 } from './http'

export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
}

export interface RouteDefinition {
  method: HttpMethod
  path: string
  propertyKey: string
  mws: Function[]
}

export interface JSONPatch {
  op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test'
  from?: string
  path: string
  value: any
}

export function Controller(prefix = '', ...gmws: Function[]) {
  return function (target: any) {
    Reflect.defineMetadata('prefix', prefix, target)
    Reflect.defineMetadata('gmws', gmws, target)
  }
}

export function Get(path = '', ...mws: Function[]) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }
    const routes = Reflect.getMetadata<RouteDefinition[]>('routes', target)
    routes.push({ method: HttpMethod.GET, path, propertyKey, mws })
  }
}

export function Post(path = '', ...mws: Function[]) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }

    const routes = Reflect.getMetadata<RouteDefinition[]>('routes', target)
    routes.push({ method: HttpMethod.POST, path, propertyKey, mws })
  }
}

export function Put(path = '', ...mws: Function[]) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }
    const routes = Reflect.getMetadata<RouteDefinition[]>('routes', target)
    routes.push({ method: HttpMethod.PUT, path, propertyKey, mws })
  }
}

export function Delete(path = '', ...mws: Function[]) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }
    const routes = Reflect.getMetadata<RouteDefinition[]>('routes', target)
    routes.push({ method: HttpMethod.DELETE, path, propertyKey, mws })
  }
}

export function Patch(path = '', ...mws: Function[]) {
  return function (target: any, propertyKey: string) {
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target)
    }
    const routes = Reflect.getMetadata<RouteDefinition[]>('routes', target)
    routes.push({ method: HttpMethod.PATCH, path, propertyKey, mws })
  }
}

export function Model(Clazz: any) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    descriptor.value = async function (ctx: Ctx) {
      const id = ctx.params.id
      try {
        const result = await Clazz.findOneBy({ id })
        if (!result) {
          throw new Http404('Resource does not exist.')
        }
        const args = [result, ctx]
        return method.apply(this, args)
      } catch (error) {
        if (error instanceof Http404) {
          throw error
        }
        throw new Http500(500, error.message)
      }
    }
  }
}

export function Payload(Clazz: any) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    descriptor.value = function (ctx: Ctx) {
      const clazz = new Clazz()
      validateInput(clazz, ctx.request.body)
      return method.apply(this, [clazz, ctx])
    }
  }
}

export function ModelPayload(ModelClass: any, PayloadClass: any) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    descriptor.value = async function (ctx: Ctx) {
      const id = ctx.params.id
      try {
        const result = await ModelClass.findOneBy({ id })
        if (!result) {
          throw new Http404('Resource does not exist.')
        }
        const payload = new PayloadClass()
        validateInput(payload, ctx.request.body)
        const args = [result, payload, ctx]
        return method.apply(this, args)
      } catch (error) {
        if (error instanceof Http404) {
          throw error
        }
        throw new Http500(500, error.message)
      }
    }
  }
}

export function QueryParams(Clazz: any) {
  return function (
    _target: Object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value
    descriptor.value = function (ctx: Ctx) {
      const queryParams = Object.fromEntries(
        ctx.request.URL.searchParams.entries()
      )
      const clazz = new Clazz()
      validateInput(clazz, queryParams)
      return method.apply(this, [clazz, ctx])
    }
  }
}
