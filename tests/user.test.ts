import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src";
import { db } from "../src/db";
import { users, session } from "../src/db/schema";
import bcrypt from "bcryptjs";

async function clearDB() {
  await db.delete(session);
  await db.delete(users);
}

const BASE_URL = "http://localhost";

describe("User API Tests", () => {
  beforeEach(async () => {
    await clearDB();
  });

  describe("1. Registrasi User (POST /api/users)", () => {
    it("[Success] Mendaftar dengan data valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const result: any = await response.json();
      expect(result.data).toBe("OK");

      // Verify DB
      const dbUser = await db.select().from(users).limit(1);
      expect(dbUser.length).toBe(1);
      expect(dbUser[0].email).toBe("test@example.com");
    });

    it("[Error 400] Mendaftar dengan email yang sudah terdaftar", async () => {
      // Seed data
      await db.insert(users).values({
        name: "Existing",
        email: "exist@example.com",
        password: "hashed",
      });

      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New User",
            email: "exist@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const result: any = await response.json();
      expect(result.error).toBe("email sudah terdaftar");
    });

    it("[Error 422] Mendaftar dengan format email tidak valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test",
            email: "invalid-email",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("[Error 422] Mendaftar dengan karakter melebihi batas (300 chars)", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "A".repeat(300),
            email: "test@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("[Error 422] Body request tidak lengkap", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test",
            email: "test@example.com",
            // password missing
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("2. Login User (POST /api/users/login)", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      await db.insert(users).values({
        name: "Login Test",
        email: "login@example.com",
        password: hashedPassword,
      });
    });

    it("[Success] Login dengan kredensial benar", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(200);
      const result: any = await response.json();
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe("string");
    });

    it("[Error 400] Login dengan email belum terdaftar", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "unknown@example.com",
            password: "password123",
          }),
        })
      );

      expect(response.status).toBe(400);
      const result: any = await response.json();
      expect(result.error).toBe("email atau password salah");
    });

    it("[Error 400] Login dengan password salah", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "wrong-password",
          }),
        })
      );

      expect(response.status).toBe(400);
    });

    it("[Error 422] Format request body salah", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email",
            password: "p",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("3. Get Current User (GET /api/users/current)", () => {
    let testToken = "test-token-uuid";

    beforeEach(async () => {
      const [user]: any = await db.insert(users).values({
        name: "Current User",
        email: "current@example.com",
        password: "hashed",
      });
      
      // In MySQL, result might be ResultSetHeader
      const userId = user.insertId;
      await db.insert(session).values({
        token: testToken,
        userId: userId,
      });
    });

    it("[Success] Berhasil mengambil profil dengan token valid", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/current`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${testToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const result: any = await response.json();
      expect(result.data.email).toBe("current@example.com");
    });

    it("[Error 401] Token tidak terdaftar", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/current`, {
          method: "GET",
          headers: {
            "Authorization": "Bearer non-existent-token",
          },
        })
      );

      expect(response.status).toBe(401);
    });

    it("[Error 401] Tanpa header Authorization", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/current`, {
          method: "GET",
        })
      );

      expect(response.status).toBe(401);
    });

    it("[Error 401] Format Authorization bukan Bearer", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/current`, {
          method: "GET",
          headers: {
            "Authorization": `Basic ${testToken}`,
          },
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe("4. Logout User (DELETE /api/users/logout)", () => {
    let testToken = "logout-token-uuid";

    beforeEach(async () => {
      const [user]: any = await db.insert(users).values({
        name: "Logout User",
        email: "logout@example.com",
        password: "hashed",
      });
      
      const userId = user.insertId;
      await db.insert(session).values({
        token: testToken,
        userId: userId,
      });
    });

    it("[Success] Berhasil logout dan menghapus sesi di DB", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/logout`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${testToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const result: any = await response.json();
      expect(result.data).toBe("ok");

      // Verify DB session is gone
      const dbSession = await db.select().from(session);
      expect(dbSession.length).toBe(0);
    });

    it("[Error 401] Logout dengan token salah", async () => {
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/logout`, {
          method: "DELETE",
          headers: {
            "Authorization": "Bearer wrong-token",
          },
        })
      );

      expect(response.status).toBe(401);
    });

    it("[Error 401] Double logout (token sudah dihapus)", async () => {
      // First logout
      await app.handle(
        new Request(`${BASE_URL}/api/users/logout`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${testToken}` },
        })
      );

      // Second logout
      const response = await app.handle(
        new Request(`${BASE_URL}/api/users/logout`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${testToken}` },
        })
      );

      expect(response.status).toBe(401);
    });
  });
});
