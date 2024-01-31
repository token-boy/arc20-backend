import Koa from 'koa'
import Router from 'koa-router'

import initStorage from 'database'
import initRoutes from 'controllers'
import cors from 'middlewares/cors'
import initTasks from 'tasks'

const app = new Koa()
const router = new Router()

await initStorage()
initTasks()

initRoutes(router)
app.use(router.routes())
app.use(router.allowedMethods())
app.use(cors)

const port = parseInt(process.env.PORT ?? '80')

try {
  app.listen({ host: '0.0.0.0', port })
  console.log(`App listen on ${port}`)
} catch (error) {
  console.error(error)
}
