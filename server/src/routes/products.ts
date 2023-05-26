import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function productsRoutes(app: FastifyInstance) {
  app.post(
    "/",
    {
      preValidation: async (req) => {
        return await req.jwtVerify()
      },
    },
    async (req, rep) => {
      const bodySchema = z.object({
        name: z.string(),
        type: z.string(),
        description: z.string(),
        amount: z.number(),
        priceInCents: z.number(),
      });

      const { amount, name, priceInCents, type, description } =
        bodySchema.parse(req.body);

      const userLogged = await req.jwtVerify();

      const product = await prisma.products.findFirst({
        where: {
          name,
        },
      });

      if (!!product) {
        return rep
          .status(400)
          .send({ message: "Already exists product with this name" });
      }

      if (!userLogged) {
        return rep.status(401).send({ message: "Token has expired" });
      }

      await prisma.products.create({
        data: {
          name,
          amount,
          type,
          price_in_cents: priceInCents,
          user_id: userLogged.sub,
          description,
        },
      });

      return rep.status(201).send();
    }
  );

  app.post('/purchase', { preValidation: async (req) => {
    await req.jwtVerify()
  }}, async (req, rep) => {
    const bodySchema = z.object({
      productId: z.string().uuid(),
      userId: z.string().uuid(),
      amount: z.number()
    })

    const { amount, productId, userId } = bodySchema.parse(req.body)

    await prisma.purchase.create({
      data: {
        amount,
        product_id: productId,
        user_id: userId
      }
    })

    return rep.status(201).send()
  })

  app.get("/hots", async (req, rep) => {
    const products = await prisma.products.findMany();

    const list = products.reduce((acc, product) => {
      if (acc.length < 5) {
        acc.push(product);

        return acc;
      }

      const lowerStock = acc.findIndex((p) => p.amount <= product.amount);

      acc[lowerStock] = product;
      return acc;
    }, [] as typeof products);

    const formattedList = list.map((product) => ({
      name: product.name,
      id: product.id,
      priceInCents: product.price_in_cents,
      amount: product.amount,
      createdAt: product.created_at
    }));

    return { products: formattedList };
  });

  app.get("/", async (req, rep) => {
    const products = await prisma.products.findMany();

    const formattedList = products.map((product) => ({
      name: product.name,
      id: product.id,
      priceInCents: product.price_in_cents,
      createdAt: product.created_at
    }));

    return { products: formattedList };
  });

  app.get("/:id", async (req, rep) => {
    const paramsSchema = z.object({
      id: z.string().uuid({ message: "Invalid Id" }),
    });

    const { id } = paramsSchema.parse(req.params);

    const product = await prisma.products.findFirstOrThrow({
      where: {
        id,
      },
    });

    return { product };
  });

  app.put(
    "/:id",
    {
      preValidation: async (req) => {
        return await req.jwtVerify()
      },
    },
    async (req, rep) => {
      const bodySchema = z.object({
        name: z.string().optional(),
        amount: z.number().optional(),
        description: z.string(),
        price: z.number().optional(),
      });

      const paramsSchema = z.object({
        id: z.string().uuid({ message: "Invalid Id" }),
      });

      const { amount, price, name, description } = bodySchema.parse(req.body);

      const { id } = paramsSchema.parse(req.params);

      const product = await prisma.products.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (product) {
        await prisma.products.update({
          data: {
            amount: amount ?? product.amount,
            name: name ?? product.name,
            price_in_cents: price ?? product.price_in_cents,
            description: description ?? product.description,
          },
          where: {
            id,
          },
        });
      }

      return rep.status(202).send();
    }
  );

  app.patch("/:id", async (req, rep) => {
    const bodySchema = z.object({
      amount: z.number(),
    });

    const paramsSchema = z.object({
      id: z.string().uuid({ message: "Invalid Id" }),
    });
    
    const { amount } = bodySchema.parse(req.body);

    const { id } = paramsSchema.parse(req.params);

    await prisma.products.update({
      data: {
        amount,
      },
      where: {
        id,
      },
    });

    return rep.status(202).send();
  });

  app.delete(
    "/:id",
    {
      preValidation: async (req) => {
        return await req.jwtVerify()
      },
    },
    async (req, rep) => {
      const paramsSchema = z.object({
        id: z.string().uuid({ message: "Invalid Id" }),
      });

      const { id } = paramsSchema.parse(req.params);

      await prisma.products.delete({
        where: {
          id,
        },
      });

      return rep.status(204).send();
    }
  );
}
