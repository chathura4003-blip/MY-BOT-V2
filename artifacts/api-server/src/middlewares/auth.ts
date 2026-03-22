import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../routes/auth";

export interface AdminRequest extends Request {
  admin?: { user: string };
}

export function authMiddleware(req: AdminRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }
  try {
    req.admin = jwt.verify(token, JWT_SECRET) as { user: string };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
