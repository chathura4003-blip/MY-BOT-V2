import React from "react";
import { useGetStats } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, Cpu, HardDrive, Users, FileText,
  MessageSquare, Zap, Clock, Wifi, Server,
  ArrowDown, ArrowUp, CheckCircle2, WifiOff,
  QrCode, Phone, Terminal, RefreshCw, Bot,
} from "lucide-react";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatMem(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export default function Dashboard() {
  const { data: stats, isLoading, dataUpdatedAt } = useGetStats({
    query: { refetchInterval: 5000 } as any,
  });

  const { data: qrData } = useQuery({
    queryKey: ["/api/qr"],
    queryFn: async () => {
      const r = await fetch(`${import.meta.env.BASE_URL}api/qr`, {
        headers: getAuthHeaders(),
      });
      return r.json() as Promise<{ qr: string | null; connected: boolean }>;
    },
    refetchInterval: 5000,
  });

  if (isLoading && !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <Bot className="absolute inset-0 m-auto w-6 h-6 text-primary" />
          </div>
          <p className="font-mono text-primary text-sm tracking-widest animate-pulse">
            GATHERING_TELEMETRY...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const isConnected = qrData?.connected || stats.status === "Connected";
  const hasPendingQR = !isConnected && qrData?.qr;
  const cpuPercent = Math.min(100, Math.round(parseFloat(stats.cpuLoad || "0") * 100));
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";
  const netStats = stats.net || { speedRx: "0 KB/s", totalRx: "0 MB", speedTx: "0 KB/s", totalTx: "0 MB" };

  return (
    <div className="space-y-5">

      {/* ── Hero Status Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-3xl overflow-hidden border p-6 ${
          isConnected
            ? "bg-green-500/10 border-green-500/25"
            : hasPendingQR
            ? "bg-yellow-500/10 border-yellow-500/25"
            : "bg-primary/10 border-primary/20"
        }`}
      >
        {/* Background glow */}
        <div
          className={`absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isConnected ? "bg-green-500/15" : hasPendingQR ? "bg-yellow-500/15" : "bg-primary/10"
          }`}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: status */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
                isConnected
                  ? "bg-green-500/20 border-green-500/40 shadow-green-500/20"
                  : hasPendingQR
                  ? "bg-yellow-500/20 border-yellow-500/40 shadow-yellow-500/20"
                  : "bg-primary/20 border-primary/30 shadow-primary/20"
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              ) : hasPendingQR ? (
                <QrCode className="w-8 h-8 text-yellow-400" />
              ) : (
                <WifiOff className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected
                      ? "bg-green-500 animate-pulse"
                      : hasPendingQR
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  {isConnected ? "ONLINE" : hasPendingQR ? "AWAITING_SCAN" : "OFFLINE"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white font-display">
                {isConnected
                  ? "Bot Connected"
                  : hasPendingQR
                  ? "Scan QR to Connect"
                  : "Bot Disconnected"}
              </h2>
              {isConnected && stats.number && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  +{stats.number}
                </p>
              )}
              {!isConnected && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {hasPendingQR
                    ? "Go to Sessions page and scan the QR code"
                    : "Go to Sessions → Reconnect Bot"}
                </p>
              )}
            </div>
          </div>

          {/* Right: uptime + last update */}
          <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
            <div className="text-right">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Process Uptime
              </p>
              <p className="text-xl font-bold font-mono text-white">
                {formatUptime(stats.uptime)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <RefreshCw className="w-3 h-3" />
              <span className="font-mono">Updated {lastUpdate}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Commands Today",
            value: Number(stats.commandsToday || 0).toLocaleString(),
            icon: Zap,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            glow: "rgba(234,179,8,0.15)",
            sub: "total triggers",
          },
          {
            label: "Messages Handled",
            value: Number(stats.messagesHandled || 0).toLocaleString(),
            icon: MessageSquare,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
            glow: "rgba(236,72,153,0.15)",
            sub: "this session",
          },
          {
            label: "Known Users",
            value: Number(stats.userCount || 0).toLocaleString(),
            icon: Users,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            glow: "rgba(168,85,247,0.15)",
            sub: "in database",
          },
          {
            label: "Files Stored",
            value: `${Number(stats.fileCount || 0)}`,
            icon: FileText,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "border-cyan-500/20",
            glow: "rgba(34,211,238,0.15)",
            sub: `${stats.fileSizeMB} MB total`,
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`relative rounded-2xl p-5 border ${card.border} ${card.bg} overflow-hidden group`}
          >
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-150"
              style={{ background: card.glow }}
            />
            <div className={`w-10 h-10 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
              {card.label}
            </p>
            <p className={`text-3xl font-bold font-display ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* System Resources */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Server className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-white">System Resources</h3>
          </div>

          {/* CPU */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="w-3.5 h-3.5" /> CPU Load
              </span>
              <span className="font-mono text-white font-semibold">{stats.cpuLoad}</span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/5">
              <motion.div
                className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-primary relative"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, cpuPercent)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground/60 text-right">
              {cpuPercent}% of capacity
            </p>
          </div>

          {/* Memory */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <HardDrive className="w-3.5 h-3.5" /> Memory
              </span>
              <span className="font-mono text-white font-semibold">
                {formatMem(stats.memUsed)} / {formatMem(stats.memTotal)}
              </span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border border-white/5">
              <motion.div
                className={`h-2.5 rounded-full relative ${
                  stats.memPercent > 85
                    ? "bg-gradient-to-r from-orange-500 to-red-500"
                    : "bg-gradient-to-r from-primary to-accent"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${stats.memPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </motion.div>
            </div>
            <p className="text-xs text-muted-foreground/60 text-right">
              {stats.memPercent}% used
            </p>
          </div>

          {/* Runtime info */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Platform</p>
              <p className="text-sm font-mono text-white capitalize">{stats.platform}</p>
            </div>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Node.js</p>
              <p className="text-sm font-mono text-white">{stats.nodeVersion}</p>
            </div>
          </div>
        </motion.div>

        {/* Network Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="lg:col-span-1 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-bold text-white">Network I/O</h3>
          </div>

          <div className="space-y-3">
            {/* Download */}
            <div className="bg-black/30 border border-blue-500/15 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0">
                <ArrowDown className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Download
                </p>
                <p className="text-xl font-bold font-mono text-blue-300 truncate">
                  {netStats.speedRx}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-mono text-muted-foreground/80">{netStats.totalRx}</p>
              </div>
            </div>

            {/* Upload */}
            <div className="bg-black/30 border border-pink-500/15 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center flex-shrink-0">
                <ArrowUp className="w-5 h-5 text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  Upload
                </p>
                <p className="text-xl font-bold font-mono text-pink-300 truncate">
                  {netStats.speedTx}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-mono text-muted-foreground/80">{netStats.totalTx}</p>
              </div>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 pt-2">
            <Activity className="w-3 h-3" />
            <span className="font-mono">Live · refreshes every 5s</span>
          </div>
        </motion.div>

        {/* Bot Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="lg:col-span-1 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-white">Bot Identity</h3>
          </div>

          <div className="space-y-3 flex-1">
            <BotInfoRow label="BOT NAME" value="CHATHU MD" accent="text-primary" />
            <BotInfoRow
              label="STATUS"
              value={isConnected ? "Connected" : hasPendingQR ? "QR Pending" : "Disconnected"}
              accent={isConnected ? "text-green-400" : hasPendingQR ? "text-yellow-400" : "text-red-400"}
            />
            {isConnected && stats.number && (
              <BotInfoRow label="LINKED NUMBER" value={`+${stats.number}`} accent="text-white" mono />
            )}
            {stats.connectedAt && (
              <BotInfoRow
                label="CONNECTED AT"
                value={new Date(stats.connectedAt).toLocaleString()}
                accent="text-white"
                mono
              />
            )}
            <BotInfoRow label="COMMANDS LOADED" value="89" accent="text-cyan-400" />
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="w-3 h-3 text-primary" />
              <span className="font-mono">CHATHU_MD · v1.0 · Baileys</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BotInfoRow({
  label,
  value,
  accent,
  mono = false,
}: {
  label: string;
  value: string;
  accent: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-black/30 rounded-xl px-4 py-3 border border-white/5">
      <p className="text-xs text-muted-foreground font-mono tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${accent} ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
