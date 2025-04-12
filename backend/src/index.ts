import { resolvers } from "./graphql/resolvers/main";
import { typeDefs } from "./graphql/typeDefs/main";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { config } from "dotenv";
import cors from "cors";
// Update the import to use the locally generated Prisma client
import { PrismaClient } from "./generated/prisma";
import { authMiddleware } from "./middleware/auth";

interface Context {
  prisma: PrismaClient;
  user?: { id: number };
}

async function startServer() {
  config({ path: ".env" });
  const app = express();
  const port = process.env.PORT || 8000;
  const prisma = new PrismaClient();

  app.use(express.json());
  app.use(cors<cors.CorsRequest>());
  app.use(authMiddleware);

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({
        prisma,
        user: (req as any).user,
      }),
    })
  );

  app.listen(port, () => {
    console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
