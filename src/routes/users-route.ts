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
    detail: {
      tags: ["Auth"],
      summary: "Registrasi User Baru",
      description: "Mendaftarkan user baru dengan nama, email, dan password."
    },
    body: t.Object({
      name: t.String({ maxLength: 255 }),
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ maxLength: 255 })
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
    detail: {
      tags: ["Auth"],
      summary: "Login User",
      description: "Melakukan autentikasi user dan mengembalikan token sesi."
    },
    body: t.Object({
      email: t.String({ format: "email", maxLength: 255 }),
      password: t.String({ maxLength: 255 })
    })
  })
  .derive(({ headers }) => {
    const auth = headers.authorization;
    return {
      token: (auth && auth.startsWith("Bearer ")) ? auth.substring(7) : null
    };
  })
  .get("/current", async ({ token, set }) => {
    try {
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const result = await UsersService.getCurrentUser(token);
      return result;
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  }, {
    detail: {
      tags: ["User"],
      summary: "Get Current User",
      description: "Mengambil profil user yang sedang login berdasarkan Bearer Token.",
      security: [{ BearerAuth: [] }]
    }
  })
  .delete("/logout", async ({ token, set }) => {
    try {
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const result = await UsersService.logout(token);
      return result;
    } catch (error: any) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  }, {
    detail: {
      tags: ["Auth"],
      summary: "Logout User",
      description: "Menghapus sesi/token user dari database.",
      security: [{ BearerAuth: [] }]
    }
  });
