import fastify from "fastify";
import 'dotenv/config'
import jwt from '@fastify/jwt'
import { env } from "./env";
import { usersRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { productsRoutes } from "./routes/products";
import fastifyCookie from "@fastify/cookie";
import cors from "@fastify/cors";

const app = fastify()

app.register(fastifyCookie)
app.register(jwt, {
  secret: env.JWT_SECRET
})

app.register(cors, {
  origin: true,
})

app.register(authRoutes)
app.register(usersRoutes, {
  prefix: '/users'
})
app.register(productsRoutes, {
  prefix: '/products'
})

app.listen({
  port: env.PORT
}, () => {
  console.log(`HTTP server running on port ${env.PORT}`)
})