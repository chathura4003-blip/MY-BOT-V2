import { Router, type IRouter, type Response } from "express";
import { authMiddleware, type AdminRequest } from "../middlewares/auth";
import { appState } from "../state";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", authMiddleware, (_req: AdminRequest, res: Response) => {
  res.json(appState.getSettings());
});

router.post("/settings", authMiddleware, (req: AdminRequest, res: Response) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  appState.updateSettings(parsed.data);
  res.json({ ok: true });
});

router.post("/bot/restart", authMiddleware, (_req: AdminRequest, res: Response) => {
  appState.restartBot();
  res.json({ ok: true, message: "Restart queued — reconnecting in ~5 seconds" });
});

export default router;
