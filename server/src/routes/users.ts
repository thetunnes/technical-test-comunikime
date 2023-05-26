import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";

export async function usersRoutes(app: FastifyInstance) {

  // app.addHook('preValidation', async (req) => {
  //   await req.jwtVerify()
  // })

  app.post("/", async (req, rep) => {

    const bodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
      isAdmin: z.boolean()
    })

    const { email, isAdmin, name, password } = bodySchema.parse(req.body)

    const encryptedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (user) {
      return rep.status(400).send({ message: 'Already exists an account associate with this e-mail.'})
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: encryptedPassword,
        is_admin: isAdmin
      },
    })

    return rep.status(201).send()

  })

  app.get("/", async (req, rep) => {
    const {token} = req.cookies

    const decodedData = app.jwt.decode(token as string)

    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return { users }
  })

  app.get("/:id", async (req, rep) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    const user = prisma.user.findFirstOrThrow({
      where: {
        id
      }
    })


    if (!user) {
      return rep.status(400).send({ message: 'Not found user'})
    }

    return { user }
  });
}
