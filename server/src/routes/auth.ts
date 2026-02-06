import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { authMiddleware, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const authSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

authRouter.post("/register", async (req, res) => {
  // Check if any user exists (only first user can register)
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    res.status(403).json({ error: "Registration is disabled" });
    return;
  }

  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { username, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id });

    const token = signToken({ userId: result[0].id, username });
    res.status(201).json({ token, username });
  } catch {
    res.status(409).json({ error: "Username already taken" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { username, password } = parsed.data;
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user[0].passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user[0].id, username });
  res.json({ token, username });
});

authRouter.get("/me", authMiddleware, (req, res) => {
  res.json({ userId: req.user!.userId, username: req.user!.username });
});
