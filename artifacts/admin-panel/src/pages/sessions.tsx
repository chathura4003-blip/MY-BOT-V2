import React, { useState } from "react";
import { useGetSessions, useReconnectSession, useLogoutSession } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone, RefreshCw, LogOut, CheckCircle2,
  Loader2, QrCode, WifiOff, Clock, Phone,
  Wifi, ShieldCheck, AlertCircle, RotateCcw,
  Hash, Copy, Check, KeyRound, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type LinkMode = "qr" | "phone";

export default function Sessions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [linkMode, setLinkMode] = useState<LinkMode>("qr");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: sessions, isLoading } = useGetSessions({
    query: { refetchInterval: 6000 },
  });

  const { data: qrData, isFetching: qrFetching } = useQuery({
    queryKey: ["/api/qr"],
    queryFn: async () => {
      const r = await fetch(`${import.meta.env.BASE_URL}api/qr`, {
        headers: getAuthHeaders(),
      });
      return r.json() as Promise<{ qr: string | null; connected: boolean }>;
    },
    refetchInterval: 3000,
  });

  const session = sessions?.[0];
  const isConnected = qrData?.connected || session?.status === "Connected";
  const qrString = !isConnected ? (qrData?.qr ?? null) : null;
  const isPending = !isConnected && !!qrString;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/qr"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const reconnectMut = useReconnectSession({
    mutation: {
      onSuccess: () => {
        setPairCode(null);
        toast({ title: "Reconnecting", description: "Bot is restarting, please wait…" });
        setTimeout(invalidateAll, 3000);
      },
      onError: () =>
        toast({ title: "Failed", description: "Could not reconnect bot", variant: "destructive" }),
    },
  });

  const logoutMut = useLogoutSession({
    mutation: {
      onSuccess: () => {
        setPairCode(null);
        toast({ title: "Logged Out", description: "WhatsApp session has been cleared." });
        setTimeout(invalidateAll, 3000);
      },
      onError: () =>
        toast({ title: "Failed", description: "Could not logout session", variant: "destructive" }),
    },
  });

  const pairCodeMut = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const r = await fetch(`${import.meta.env.BASE_URL}api/pairing-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to get pairing code");
      return data as { ok: boolean; code: string };
    },
    onSuccess: (data) => {
      setPairCode(data.code);
      toast({ title: "Pairing Code Ready", description: "Enter this code in WhatsApp Linked Devices." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleCopy = () => {
    if (!pairCode) return;
    navigator.clipboard.writeText(pairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Pairing code copied to clipboard." });
  };

  const handleRequestCode = () => {
    const cleaned = phoneInput.replace(/\D/g, "");
    if (cleaned.length < 7) {
      toast({ title: "Invalid Number", description: "Enter a valid phone number with country code.", variant: "destructive" });
      return;
    }
    setPairCode(null);
    pairCodeMut.mutate(cleaned);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Session Manager</h2>
        <p className="text-sm text-muted-foreground">
          Manage your CHATHU MD WhatsApp connection
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Fetching session data…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left: Status & Controls ── */}
          <motion.div
            className="lg:col-span-2 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                  isConnected
                    ? "bg-green-500/15 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                    : isPending
                    ? "bg-yellow-500/15 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    : "bg-red-500/15 border-red-500/30"
                }`}
              >
                <Smartphone
                  className={`w-7 h-7 transition-colors ${
                    isConnected ? "text-green-400" : isPending ? "text-yellow-400" : "text-red-400"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-base">CHATHU MD Bot</h3>
                <p className="text-xs text-muted-foreground font-mono truncate">main · whatsapp</p>
              </div>
              <StatusBadge connected={isConnected} pending={isPending} />
            </div>

            {/* Info Cards */}
            <AnimatePresence mode="wait">
              {isConnected ? (
                <motion.div
                  key="connected-info"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {session?.number && (
                    <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="CONNECTED NUMBER">
                      <span className="font-mono font-bold text-white text-base">
                        +{session.number}
                      </span>
                    </InfoRow>
                  )}
                  {session?.connectedAt && (
                    <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="CONNECTED SINCE">
                      <span className="font-mono text-sm text-white">
                        {new Date(session.connectedAt).toLocaleString()}
                      </span>
                    </InfoRow>
                  )}
                  <InfoRow
                    icon={<ShieldCheck className="w-3.5 h-3.5 text-green-400" />}
                    label="SESSION STATUS"
                  >
                    <span className="text-green-400 text-sm font-medium">Active &amp; Secure</span>
                  </InfoRow>
                </motion.div>
              ) : isPending ? (
                <motion.div
                  key="pending-info"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <QrCode className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-semibold">Waiting for Link</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use QR Code scan or enter your phone number to get a pairing code.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="offline-info"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm font-semibold">Not Connected</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The bot is offline. Click Reconnect to generate a new QR / pairing code.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="space-y-3 mt-auto pt-2">
              <button
                onClick={() => reconnectMut.mutate({ id: "__main__" })}
                disabled={reconnectMut.isPending || logoutMut.isPending}
                className="w-full bg-primary/15 hover:bg-primary/25 border border-primary/30 hover:border-primary/50 text-primary hover:text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reconnectMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                {reconnectMut.isPending ? "Restarting Bot…" : "Reconnect Bot"}
              </button>

              <button
                onClick={() => logoutMut.mutate({ id: "__main__" })}
                disabled={logoutMut.isPending || reconnectMut.isPending}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoutMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {logoutMut.isPending ? "Logging Out…" : "Logout & Clear Session"}
              </button>
            </div>
          </motion.div>

          {/* ── Right: QR / Phone Linking ── */}
          <motion.div
            className="lg:col-span-3 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col min-h-[480px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Mode toggle — only show when not connected */}
            {!isConnected && (
              <div className="flex gap-1 bg-black/40 rounded-2xl p-1 mb-5 border border-white/5">
                <button
                  onClick={() => { setLinkMode("qr"); setPairCode(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    linkMode === "qr"
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR Code
                </button>
                <button
                  onClick={() => { setLinkMode("phone"); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    linkMode === "phone"
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Link with Phone Number
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ── Connected State ── */}
              {isConnected ? (
                <motion.div
                  key="connected-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center flex-1 py-8 gap-6"
                >
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl" />
                    <div className="relative w-28 h-28 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.25)]">
                      <Wifi className="w-12 h-12 text-green-400" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full border-2 border-background flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </span>
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white font-display mb-1">Connected</h3>
                    <p className="text-muted-foreground text-sm">
                      CHATHU MD is live and receiving messages
                    </p>
                  </div>

                  {session?.number && (
                    <div className="bg-black/30 border border-green-500/20 rounded-2xl px-8 py-4 text-center">
                      <p className="text-xs text-muted-foreground font-mono mb-1">ACTIVE NUMBER</p>
                      <p className="text-2xl font-bold text-green-400 font-mono">
                        +{session.number}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Session active and secure
                  </div>
                </motion.div>

              /* ── QR Mode ── */
              ) : linkMode === "qr" ? (
                qrString ? (
                  <motion.div
                    key="qr-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center flex-1 gap-5"
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Scan to Connect
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Open WhatsApp → Linked Devices → Link a Device
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl pointer-events-none" />
                      <div className="relative bg-white rounded-3xl p-4 shadow-[0_0_40px_rgba(139,92,246,0.35)]">
                        <QRCodeSVG
                          value={qrString}
                          size={220}
                          bgColor="#ffffff"
                          fgColor="#0d0d0d"
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-xs text-yellow-400/80">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        QR refreshes automatically every 30 seconds
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <RefreshCw className={`w-3 h-3 ${qrFetching ? "animate-spin" : ""}`} />
                        Live polling active · updates every 3s
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting-panel"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center flex-1 py-8 gap-5"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted/20 border border-white/10 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-1">Waiting for QR Code</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        The bot is starting up. A QR code will appear here shortly. If it
                        doesn't appear, click Reconnect.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Polling bot every 3 seconds…
                    </div>
                  </motion.div>
                )

              /* ── Phone Number / Pairing Code Mode ── */
              ) : (
                <motion.div
                  key="phone-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col flex-1 gap-5"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
                      <KeyRound className="w-5 h-5 text-primary" />
                      Link with Phone Number
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Get a pairing code — no camera needed
                    </p>
                  </div>

                  {/* Phone input */}
                  <div className="space-y-3">
                    <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                      Your WhatsApp Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => {
                            setPairCode(null);
                            setPhoneInput(e.target.value);
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleRequestCode()}
                          placeholder="94771234567"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 focus:bg-black/60 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleRequestCode}
                        disabled={pairCodeMut.isPending || !phoneInput.trim()}
                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                      >
                        {pairCodeMut.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Hash className="w-4 h-4" />
                        )}
                        {pairCodeMut.isPending ? "Getting Code…" : "Get Code"}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                      Enter with country code, no + or spaces. Example: <span className="font-mono text-muted-foreground">94771234567</span>
                    </p>
                  </div>

                  {/* Pairing Code Display */}
                  <AnimatePresence>
                    {pairCode && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        className="relative bg-black/50 border border-primary/30 rounded-2xl p-5 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-mono text-muted-foreground tracking-widest">
                              PAIRING CODE
                            </p>
                            <button
                              onClick={handleCopy}
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-white bg-primary/15 hover:bg-primary/30 border border-primary/30 px-3 py-1.5 rounded-lg transition-all"
                            >
                              {copied ? (
                                <><Check className="w-3 h-3" /> Copied!</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </button>
                          </div>

                          {/* Code display — split into 2 groups of 4 */}
                          <div className="flex items-center justify-center gap-3 my-2">
                            {[pairCode.slice(0, 4), pairCode.slice(4)].map((part, i) => (
                              <React.Fragment key={i}>
                                <div className="bg-primary/10 border border-primary/25 rounded-xl px-5 py-3 text-center">
                                  <span className="text-3xl font-bold font-mono text-white tracking-[0.25em]">
                                    {part}
                                  </span>
                                </div>
                                {i === 0 && (
                                  <span className="text-2xl text-muted-foreground font-mono">-</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-yellow-400/80">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            Code expires in ~60 seconds — enter it quickly
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Instructions */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mt-auto space-y-2.5">
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-primary" />
                      How to enter the pairing code in WhatsApp
                    </p>
                    {[
                      "Open WhatsApp on your phone",
                      "Tap ⋮ Menu → Settings → Linked Devices",
                      'Tap "Link a Device" → "Link with phone number instead"',
                      "Enter your phone number → tap Next",
                      "Enter the pairing code shown above",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Connection Guide — only for QR mode */}
      {!isConnected && linkMode === "qr" && (
        <motion.div
          className="bg-card/40 border border-white/5 rounded-2xl p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            How to Connect via QR Code
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", text: "Open WhatsApp on your phone" },
              { step: "2", text: "Tap ⋮ Menu → Linked Devices → Link a Device" },
              { step: "3", text: "Point your camera at the QR code shown above" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatusBadge({ connected, pending }: { connected: boolean; pending: boolean }) {
  if (connected) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/15 border border-green-500/30 px-3 py-1.5 rounded-full whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Connected
      </span>
    );
  }
  if (pending) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-3 py-1.5 rounded-full whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
        QR Pending
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/15 border border-red-500/30 px-3 py-1.5 rounded-full whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Offline
    </span>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black/30 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        {icon}
        <span className="tracking-wider font-mono">{label}</span>
      </div>
      {children}
    </div>
  );
}
