import Koa from 'koa'
import Router from 'koa-router'

import initStorage from 'database'
import initRoutes from 'controllers'

const app = new Koa()
const router = new Router()

await initStorage()

initRoutes(router)
app.use(router.routes())
app.use(router.allowedMethods())

const port = parseInt(process.env.PORT ?? '80')

try {
  app.listen({ host: '0.0.0.0', port })
  console.log(`App listen on ${port}`)
} catch (error) {
  console.error(error)
}
