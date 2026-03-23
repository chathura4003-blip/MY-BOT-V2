import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware, type AdminRequest } from "../middlewares/auth";

const BOT_INTERNAL_URL = `http://127.0.0.1:${process.env.BOT_INTERNAL_PORT || 9091}/bot-internal`;

async function proxyGet(path: string) {
  try {
    const r = await fetch(`${BOT_INTERNAL_URL}${path}`, { signal: AbortSignal.timeout(5000) });
    return { ok: true, data: await r.json(), status: r.status };
  } catch (e: any) {
    return { ok: false, error: e.message, data: null, status: 503 };
  }
}

async function proxyPost(path: string, body?: unknown) {
  try {
    const r = await fetch(`${BOT_INTERNAL_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    return { ok: true, data: await r.json(), status: r.status };
  } catch (e: any) {
    return { ok: false, error: e.message, data: null, status: 503 };
  }
}

async function proxyDelete(path: string) {
  try {
    const r = await fetch(`${BOT_INTERNAL_URL}${path}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: true, data: await r.json(), status: r.status };
  } catch (e: any) {
    return { ok: false, error: e.message, data: null, status: 503 };
  }
}

const router: IRouter = Router();

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/stats", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyGet("/status");
  if (!result.ok) {
    res.json({
      status: "Disconnected",
      number: null,
      connectedAt: null,
      uptime: 0,
      memUsed: 0,
      memTotal: 0,
      memPercent: 0,
      cpuLoad: "0.00",
      platform: "linux",
      nodeVersion: process.version,
      userCount: 0,
      fileCount: 0,
      fileSizeMB: "0.0",
      commandsToday: 0,
      messagesHandled: 0,
      net: { speedRx: "0 B/s", speedTx: "0 B/s", totalRx: "0 MB", totalTx: "0 MB" },
      botOffline: true,
      error: "Bot service is offline"
    });
    return;
  }
  const d = result.data as any;
  res.json({
    status: d.status || "Disconnected",
    number: d.number || null,
    connectedAt: d.connectedAt || null,
    uptime: d.uptime || 0,
    memUsed: d.memUsed || 0,
    memTotal: d.memTotal || 0,
    memPercent: d.memPercent || 0,
    cpuLoad: d.cpuLoad || "0.00",
    platform: d.platform || "linux",
    nodeVersion: d.nodeVersion || process.version,
    userCount: d.userCount || 0,
    fileCount: d.fileCount || 0,
    fileSizeMB: d.fileSizeMB || "0.0",
    commandsToday: d.commandsToday || 0,
    messagesHandled: d.messagesHandled || 0,
    net: d.net || { speedRx: "0 B/s", speedTx: "0 B/s", totalRx: "0 MB", totalTx: "0 MB" },
  });
});

// ── Sessions ───────────────────────────────────────────────────────────────
router.get("/sessions", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const [statusRes, qrRes] = await Promise.all([proxyGet("/status"), proxyGet("/qr")]);
  
  const status = statusRes.ok ? (statusRes.data as any) : null;
  const qrData = qrRes.ok ? (qrRes.data as any) : null;
  
  const botStatus = status?.status || "Disconnected";
  const finalStatus = qrData?.qr && !qrData?.connected ? "Awaiting QR Scan" : botStatus;

  const session = {
    id: "__main__",
    label: "CHATHU MD Bot",
    number: status?.number || null,
    status: finalStatus,
    connectedAt: status?.connectedAt || null,
    platform: "whatsapp",
    isMain: true,
    qr: qrData?.qr || null,
    pairCode: null,
  };
  res.json([session]);
});

router.post("/sessions", authMiddleware, async (_req: AdminRequest, res: Response) => {
  res.status(400).json({ error: "This bot uses a single session. Use the QR scan or pair code on the Sessions page." });
});

router.delete("/sessions/:id", authMiddleware, async (req: AdminRequest, res: Response) => {
  const result = await proxyPost("/logout");
  if (!result.ok) {
    res.status(503).json({ error: "Bot service is offline" });
    return;
  }
  res.json({ ok: true });
});

router.post("/sessions/:id/reconnect", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyPost("/restart");
  if (!result.ok) {
    res.status(503).json({ error: "Bot service is offline" });
    return;
  }
  res.json({ ok: true, message: "Restarting bot session…" });
});

router.post("/sessions/:id/logout", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyPost("/logout");
  if (!result.ok) {
    res.status(503).json({ error: "Bot service is offline" });
    return;
  }
  res.json({ ok: true, message: "Session logged out" });
});

// ── Broadcast ──────────────────────────────────────────────────────────────
router.post("/broadcast", authMiddleware, async (req: AdminRequest, res: Response) => {
  const result = await proxyPost("/broadcast", req.body);
  if (!result.ok) {
    res.status(503).json({ error: "Bot service is offline — start the bot first" });
    return;
  }
  res.status(result.status).json(result.data);
});

// ── Settings ───────────────────────────────────────────────────────────────
router.get("/settings", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyGet("/settings");
  if (!result.ok) {
    res.json({
      botName: "CHATHU MD",
      prefix: ".",
      ownerNumber: "",
      autoRead: true,
      autoTyping: true,
      nsfwEnabled: false,
      premiumCode: "",
      maintenanceMode: false,
      maxSessions: 5,
      botOffline: true,
    });
    return;
  }
  res.json(result.data);
});

router.post("/settings", authMiddleware, async (req: AdminRequest, res: Response) => {
  const result = await proxyPost("/settings", req.body);
  if (!result.ok) {
    res.status(503).json({ error: "Bot service is offline" });
    return;
  }
  res.json(result.data);
});

// ── Bot restart ────────────────────────────────────────────────────────────
router.post("/bot/restart", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyPost("/restart");
  if (!result.ok) {
    res.status(503).json({ error: "Bot service is offline" });
    return;
  }
  res.json({ ok: true, message: "CHATHU MD restarting…" });
});

// ── Logs ───────────────────────────────────────────────────────────────────
router.get("/logs", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyGet("/logs");
  if (!result.ok) {
    res.json([{
      id: "bot-offline",
      timestamp: new Date().toISOString(),
      level: "warn",
      message: "Bot service is offline. Start the CHATHU MD bot workflow to see real logs.",
      meta: null,
    }]);
    return;
  }
  res.json(result.data);
});

// ── Mods ───────────────────────────────────────────────────────────────────
router.get("/mods", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyGet("/mods");
  if (!result.ok) { res.status(503).json({ error: "Bot offline" }); return; }
  res.json(result.data);
});

router.post("/mods", authMiddleware, async (req: AdminRequest, res: Response) => {
  const result = await proxyPost("/mods", req.body);
  if (!result.ok) { res.status(503).json({ error: "Bot offline" }); return; }
  res.json(result.data);
});

router.delete("/mods/:jid", authMiddleware, async (req: Request, res: Response) => {
  const result = await proxyDelete(`/mods/${encodeURIComponent(req.params.jid)}`);
  if (!result.ok) { res.status(503).json({ error: "Bot offline" }); return; }
  res.json(result.data);
});

// ── Bans ───────────────────────────────────────────────────────────────────
router.get("/bans", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyGet("/bans");
  if (!result.ok) { res.status(503).json({ error: "Bot offline" }); return; }
  res.json(result.data);
});

router.post("/bans", authMiddleware, async (req: AdminRequest, res: Response) => {
  const result = await proxyPost("/bans", req.body);
  if (!result.ok) { res.status(503).json({ error: "Bot offline" }); return; }
  res.json(result.data);
});

router.delete("/bans/:jid", authMiddleware, async (req: Request, res: Response) => {
  const result = await proxyDelete(`/bans/${encodeURIComponent(req.params.jid)}`);
  if (!result.ok) { res.status(503).json({ error: "Bot offline" }); return; }
  res.json(result.data);
});

// ── QR Code ────────────────────────────────────────────────────────────────
router.get("/qr", authMiddleware, async (_req: AdminRequest, res: Response) => {
  const result = await proxyGet("/qr");
  if (!result.ok) { res.status(503).json({ qr: null, connected: false, error: "Bot offline" }); return; }
  res.json(result.data);
});

export default router;
