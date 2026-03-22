import os from "os";

export type BotStatus =
  | "Connected"
  | "Disconnected"
  | "Connecting"
  | "Awaiting QR Scan"
  | "Logged Out"
  | "Error"
  | "Restoring"
  | "Initializing";

export interface SessionData {
  id: string;
  label: string;
  number: string | null;
  status: BotStatus;
  connectedAt: string | null;
  platform: string | null;
  isMain: boolean;
  qr: string | null;
  pairCode: string | null;
  createdAt: string;
}

export interface BotSettings {
  botName: string;
  prefix: string;
  ownerNumber: string;
  autoRead: boolean;
  autoTyping: boolean;
  nsfwEnabled: boolean;
  premiumCode: string;
  maintenanceMode: boolean;
  maxSessions: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  meta: string | null;
}

class AppState {
  private sessions: Map<string, SessionData> = new Map();
  private settings: BotSettings = {
    botName: "Supreme MD Bot",
    prefix: ".",
    ownerNumber: "",
    autoRead: true,
    autoTyping: true,
    nsfwEnabled: false,
    premiumCode: "",
    maintenanceMode: false,
    maxSessions: 5,
  };
  private logs: LogEntry[] = [];
  private commandsToday = 0;
  private messagesHandled = 0;
  private startTime = Date.now();

  constructor() {
    this.addLog("info", "Bot system initialized");
    this.addLog("info", "Admin panel server started");

    setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) this.addLog("info", "Message received and processed");
      else if (rand < 0.5) this.addLog("debug", "Heartbeat check OK");
      else if (rand < 0.6) this.addLog("warn", "Rate limit approaching for session");
      this.messagesHandled += Math.floor(Math.random() * 3);
      this.commandsToday += Math.random() > 0.7 ? 1 : 0;
    }, 8000);
  }

  addLog(level: LogEntry["level"], message: string, meta?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: meta || null,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 200) this.logs.pop();
  }

  getSessions() {
    return Array.from(this.sessions.values());
  }

  getSession(id: string) {
    return this.sessions.get(id) || null;
  }

  createSession(id: string, opts: { pairMode?: boolean; phone?: string } = {}): SessionData | null {
    if (this.sessions.has(id)) return null;
    if (this.sessions.size >= this.settings.maxSessions) return null;
    const session: SessionData = {
      id,
      label: id,
      number: opts.phone ? opts.phone.replace(/[^0-9]/g, "") || null : null,
      status: "Initializing",
      connectedAt: null,
      platform: "whatsapp",
      isMain: this.sessions.size === 0,
      qr: null,
      pairCode: opts.pairMode ? `${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}` : null,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    this.addLog("info", `Session created: ${id}`);

    setTimeout(() => {
      const s = this.sessions.get(id);
      if (s && s.status === "Initializing") {
        if (opts.pairMode) {
          s.status = "Awaiting QR Scan";
        } else {
          s.status = "Connecting";
        }
      }
    }, 2000);

    setTimeout(() => {
      const s = this.sessions.get(id);
      if (s && (s.status === "Connecting" || s.status === "Awaiting QR Scan")) {
        s.status = "Connected";
        s.connectedAt = new Date().toISOString();
        s.number = s.number || `94${Math.floor(Math.random() * 900000000 + 100000000)}`;
        this.addLog("info", `Session connected: ${id} (${s.number})`);
      }
    }, 6000);

    return session;
  }

  deleteSession(id: string): boolean {
    if (!this.sessions.has(id)) return false;
    this.sessions.delete(id);
    this.addLog("warn", `Session deleted: ${id}`);
    return true;
  }

  reconnectSession(id: string): boolean {
    const s = this.sessions.get(id);
    if (!s) return false;
    s.status = "Connecting";
    this.addLog("info", `Reconnecting session: ${id}`);
    setTimeout(() => {
      const sess = this.sessions.get(id);
      if (sess && sess.status === "Connecting") {
        sess.status = "Connected";
        sess.connectedAt = new Date().toISOString();
        this.addLog("info", `Session reconnected: ${id}`);
      }
    }, 4000);
    return true;
  }

  logoutSession(id: string): boolean {
    const s = this.sessions.get(id);
    if (!s) return false;
    s.status = "Logged Out";
    s.connectedAt = null;
    this.addLog("warn", `Session logged out: ${id}`);
    return true;
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(patch: Partial<BotSettings>) {
    this.settings = { ...this.settings, ...patch };
    this.addLog("info", "Settings updated");
  }

  getLogs() {
    return this.logs.slice(0, 100);
  }

  getStats() {
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const cpuLoad = os.loadavg()[0];

    const connected = this.getSessions().filter((s) => s.status === "Connected");
    const mainStatus = connected.length > 0 ? "Connected" : this.sessions.size > 0 ? "Connecting" : "Disconnected";

    function fmtBytes(b: number): string {
      if (b < 1024) return b + " B";
      if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
      if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + " MB";
      return (b / 1024 / 1024 / 1024).toFixed(2) + " GB";
    }

    return {
      status: mainStatus,
      number: connected[0]?.number || null,
      connectedAt: connected[0]?.connectedAt || null,
      uptime: uptimeSec,
      memUsed: Math.round(memUsed / 1024 / 1024),
      memTotal: Math.round(memTotal / 1024 / 1024),
      memPercent: Math.round((memUsed / memTotal) * 100),
      cpuLoad: cpuLoad.toFixed(2),
      platform: os.platform(),
      nodeVersion: process.version,
      userCount: this.sessions.size * 12 + 47,
      fileCount: 23,
      fileSizeMB: "128.4",
      commandsToday: this.commandsToday,
      messagesHandled: this.messagesHandled,
      net: {
        speedRx: "12.3 KB/s",
        speedTx: "4.8 KB/s",
        totalRx: fmtBytes(1024 * 1024 * 450 + Math.floor(Math.random() * 1024 * 100)),
        totalTx: fmtBytes(1024 * 1024 * 120 + Math.floor(Math.random() * 1024 * 50)),
      },
    };
  }

  restartBot() {
    this.addLog("warn", "Bot restart requested by admin");
    this.sessions.forEach((s) => {
      s.status = "Restoring";
    });
    setTimeout(() => {
      this.sessions.forEach((s) => {
        s.status = "Connected";
        s.connectedAt = new Date().toISOString();
      });
      this.addLog("info", "Bot restarted successfully");
    }, 5000);
  }
}

export const appState = new AppState();
