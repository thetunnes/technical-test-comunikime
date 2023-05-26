import { FastifyInstance } from "fastify";
import { z } from "zod";
import { compare } from "bcrypt";
import { prisma } from "../lib/prisma";

export async function authRoutes(app: FastifyInstance) {

  app.get("/", async (req, rep) => {
    const paramsSchemaUser = z.object({
      email: z.string().email("Email with invalid format."),
      password: z.string(),
    });

    const { email, password } = paramsSchemaUser.parse(req.query);

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) {
      return rep.status(400).send({ message: 'E-mail or password not match'})
    }
  
    const comparePassword = await compare(password, user.password)

    if (!comparePassword) {
      return rep.status(400).send({ message: 'E-mail or password not match'})
    }

    const token = app.jwt.sign(
      {
        name: user.name,
        isAdmin: user.is_admin
      },
      {
        sub: user.id,
        expiresIn: "30 days",
      }
    );


    rep.cookie('token', token, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    })

    const { password: userPass, is_admin: isAdmin, ...dataUser } = user

    return { token, user: { isAdmin, ...dataUser } };
  });
}
