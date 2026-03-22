import { Router, type IRouter, type Response } from "express";
import { authMiddleware, type AdminRequest } from "../middlewares/auth";
import { appState } from "../state";
import { CreateSessionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sessions", authMiddleware, (_req: AdminRequest, res: Response) => {
  res.json(appState.getSessions());
});

router.post("/sessions", authMiddleware, (req: AdminRequest, res: Response) => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { id, pairMode, phone } = parsed.data;
  if (!/^[a-zA-Z0-9_-]{2,30}$/.test(id)) {
    res.status(400).json({ error: "Invalid session ID (2-30 alphanumeric chars)" });
    return;
  }
  const session = appState.createSession(id, { pairMode: !!pairMode, phone: phone || "" });
  if (!session) {
    if (appState.getSession(id)) {
      res.status(400).json({ error: "Session ID already exists" });
    } else {
      res.status(400).json({ error: "Maximum sessions reached" });
    }
    return;
  }
  res.json(session);
});

router.delete("/sessions/:id", authMiddleware, (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const ok = appState.deleteSession(id);
  if (!ok) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ ok: true });
});

router.post("/sessions/:id/reconnect", authMiddleware, (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const ok = appState.reconnectSession(id);
  if (!ok) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ ok: true, message: "Reconnect initiated" });
});

router.post("/sessions/:id/logout", authMiddleware, (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const ok = appState.logoutSession(id);
  if (!ok) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ ok: true, message: "Logged out successfully" });
});

export default router;
