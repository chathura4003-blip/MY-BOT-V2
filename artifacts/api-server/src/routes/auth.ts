import { Router, type IRouter, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { LoginBody, LoginResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
const JWT_SECRET = process.env.SESSION_SECRET || "whatsapp-bot-admin-secret-2024";

router.post("/auth/login", (req: Request, res: Response) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { username, password } = parsed.data;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: "24h" });
    const response = LoginResponse.parse({ token, username });
    res.json(response);
    return;
  }
  res.status(401).json({ error: "Invalid credentials" });
});

export { JWT_SECRET };
export default router;
