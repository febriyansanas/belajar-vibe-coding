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
    }),
    response: {
      200: t.Object({ data: t.String() }, { description: "Registrasi berhasil", examples: [{ data: "OK" }] }),
      400: t.Object({ error: t.String() }, { description: "Email sudah terdaftar", examples: [{ error: "email sudah terdaftar" }] }),
      422: t.Object({ error: t.String() }, { description: "Validasi gagal" })
    }
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
    }),
    response: {
      200: t.Object({ data: t.String() }, { description: "Login berhasil, token dikembalikan", examples: [{ data: "550e8400-e29b-41d4-a716-446655440000" }] }),
      400: t.Object({ error: t.String() }, { description: "Kredensial salah", examples: [{ error: "email atau password salah" }] }),
      422: t.Object({ error: t.String() }, { description: "Validasi gagal" })
    }
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
    },
    response: {
      200: t.Object({ data: t.Object({ id: t.Number(), name: t.String(), email: t.String(), createdAt: t.Any() }) }, { description: "Data profil user", examples: [{ data: { id: 1, name: "Sanas Febriyan", email: "sanas@example.com", createdAt: "2026-04-17T07:00:00.000Z" } }] }),
      401: t.Object({ error: t.String() }, { description: "Token tidak valid", examples: [{ error: "Unauthorized" }] })
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
    },
    response: {
      200: t.Object({ data: t.String() }, { description: "Logout berhasil", examples: [{ data: "ok" }] }),
      401: t.Object({ error: t.String() }, { description: "Token tidak valid", examples: [{ error: "Unauthorized" }] })
    }
  });
