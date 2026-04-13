import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { db } from "./db";
import { users } from "./db/schema";

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .get("/", () => "Welcome to ElysiaJS with Bun and Drizzle!")
  .get("/ping", () => ({ status: "pong", timestamp: new Date().toISOString() }))
  .get("/users", async () => {
    try {
      return await db.select().from(users);
    } catch (error) {
      return { error: "Database connection failed", details: error };
    }
  })
  .listen(process.env.PORT || 3000);

console.log(`?? Server is running at ${app.server?.hostname}:${app.server?.port}`);
console.log(`?? Swagger documentation: http://${app.server?.hostname}:${app.server?.port}/swagger`);
