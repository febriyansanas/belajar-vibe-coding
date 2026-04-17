import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { db } from "./db";
import { users } from "./db/schema";

import { usersRoute } from "./routes/users-route";

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: "Belajar Vibe Coding - User API",
        version: "1.0.0",
        description: "API untuk mengelola registrasi, login, profil user, dan logout."
      },
      tags: [
        { name: "Auth", description: "Endpoint untuk autentikasi (registrasi, login, logout)" },
        { name: "User", description: "Endpoint untuk mengelola data user" }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "UUID"
          }
        }
      }
    }
  }))
  .use(cors())
  .use(usersRoute)
  .get("/", () => "Welcome to ElysiaJS with Bun and Drizzle!")
  .get("/ping", () => ({ status: "pong", timestamp: new Date().toISOString() }))
  .get("/users", async () => {
    try {
      return await db.select().from(users);
    } catch (error) {
      return { error: "Database connection failed", details: error };
    }
  });

app.listen(process.env.PORT || 3000);

console.log(`?? Server is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`?? Swagger documentation: http://${app.server?.hostname}:${app.server?.port}/swagger`);
