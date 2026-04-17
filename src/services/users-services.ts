import { db } from "../db";
import { users, session } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export class UsersService {
  static async register(payload: any) {
    const { name, email, password } = payload;

    // 1. Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      throw new Error("email sudah terdaftar");
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert user
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return { data: "OK" };
  }

  static async login(payload: any) {
    const { email, password } = payload;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    const user = existingUser[0];
    if (!user) {
      throw new Error("email atau password salah");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("email atau password salah");
    }

    const token = crypto.randomUUID();

    await db.insert(session).values({
      token,
      userId: user.id
    });

    return { data: token };
  }

  static async getCurrentUser(token: string) {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(session)
      .innerJoin(users, eq(session.userId, users.id))
      .where(eq(session.token, token))
      .limit(1);

    const user = result[0];
    if (!user) {
      throw new Error("Unauthorized");
    }

    return { data: user };
  }

  static async logout(token: string) {
    const existingSession = await db.select().from(session).where(eq(session.token, token)).limit(1);

    if (existingSession.length === 0) {
      throw new Error("Unauthorized");
    }

    await db.delete(session).where(eq(session.token, token));

    return { data: "ok" };
  }
}
