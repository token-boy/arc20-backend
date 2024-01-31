import type { Context, Next } from 'koa'

// Allow cors origins.
const allowOrigins = JSON.parse(
  atob(process.env.ACCESS_CONTROL_LIST)
) as string[]

// Allow cors paths.
const allowPaths = ['']

async function cors(ctx: Context, next: Next) {
  const origin = ctx.request.get('origin') ?? ''
  const path = ctx.request.URL.pathname

  if (
    allowOrigins.indexOf(origin) !== -1 ||
    allowPaths.indexOf(path) !== -1 ||
    process.env.NODE_ENV === 'development'
  ) {
    ctx.response.set('Access-Control-Allow-Origin', origin)
    ctx.response.set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type'
    )
    ctx.response.set(
      'Access-Control-Allow-Methods',
      'OPTIONS, POST, DELETE, PUT, DELETE, PATCH'
    )
    if (ctx.request.method === 'OPTIONS') {
      ctx.response.status = 200
    } else {
      await next()
    }
  } else {
    ctx.response.status = 403
  }
}

export default cors
