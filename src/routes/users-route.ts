import { Elysia, t } from "elysia";
import { UsersService } from "../services/users-services";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      const result = await UsersService.register(body);
      return result;
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String(),
      password: t.String()
    })
  })
  .post("/login", async ({ body, set }) => {
    try {
      const result = await UsersService.login(body);
      return result;
    } catch (error: any) {
      set.status = 400;
      return { error: "email atau password salah" };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String()
    })
  })
  .get("/current", async ({ headers, set }) => {
    try {
      const auth = headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = auth.substring(7);
      const result = await UsersService.getCurrentUser(token);
      return result;
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
