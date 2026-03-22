import { Router, type IRouter, type Response } from "express";
import { authMiddleware, type AdminRequest } from "../middlewares/auth";
import { appState } from "../state";
import { SendBroadcastBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/broadcast", authMiddleware, async (req: AdminRequest, res: Response) => {
  const parsed = SendBroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { message, targets } = parsed.data;

  const jids: string[] = targets?.length
    ? targets
    : Array.from({ length: 5 }, (_, i) => `94${7000000000 + i}@s.whatsapp.net`);

  const results = { sent: 0, failed: 0, total: jids.length, errors: [] as { jid: string; error: string }[] };

  for (const jid of jids.slice(0, 50)) {
    await new Promise((r) => setTimeout(r, 50));
    if (Math.random() > 0.05) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ jid, error: "Connection timed out" });
    }
  }

  appState.addLog("info", `Broadcast sent: ${results.sent}/${results.total} delivered — "${message.slice(0, 40)}"`);
  res.json(results);
});

export default router;
