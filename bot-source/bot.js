"use strict";

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const { Boom } = require("@hapi/boom");

const { initSession, clearSession } = require("./session-manager");
const { loadCommands, handleCommand } = require("./lib/handler");
const { ensureYtdlp: initYtdlp } = require("./lib/ytdlp-manager");
const { logger } = require("./logger");
const state = require("./state");
const db = require("./lib/db");
const { isOwner } = require("./lib/utils");
const { BOT_NAME, OWNER_NUMBER, PREFIX } = require("./config");

const RECONNECT_DELAY = 5000;
let sock = null;
let connectionAttempts = 0;

async function startBot() {
  logger(`[Bot] Starting ${BOT_NAME}…`);

  await initYtdlp().catch((e) => logger(`[Bot] yt-dlp warning: ${e.message}`));

  loadCommands();

  return connect();
}

async function connect() {
  const { state: authState, saveCreds } = await initSession();
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: "silent" })),
    },
    browser: require("./config").BROWSER || ["SupremeBot", "Chrome", "131.0"],
    markOnlineOnConnect: true,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 3,
    syncFullHistory: false,
    generateHighQualityLinkPreviews: false,
  });

  // Aggressive Memory Sweeping
  if (global.gc) {
    const gcSweep = setInterval(() => {
      try {
        global.gc();
      } catch (err) { }
    }, 5 * 60 * 1000);
    gcSweep.unref();
  }

  sock.ev.on(
    "connection.update",
    async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        state.set("qr", qr);
        state.set("connected", false);
        qrcode.generate(qr, { small: true });
        logger("[Bot] QR code generated — scan to connect.");
      }

      if (connection === "close") {
        state.set("connected", false);
        const error = lastDisconnect?.error;
        const code = error instanceof Boom ? error.output?.statusCode : null;
        const reason = code ? DisconnectReason[code] || code : "Unknown";

        logger(`[Bot] Disconnected: ${reason} (Code: ${code})`);

        if (code === DisconnectReason.loggedOut) {
          logger("[Bot] Logged out — clearing session…");
          clearSession();
          connectionAttempts = 0;
          setTimeout(connect, RECONNECT_DELAY);
        } else {
          connectionAttempts++;
          const delay = Math.min(RECONNECT_DELAY * connectionAttempts, 60000);
          logger(
            `[Bot] Reconnecting in ${delay / 1000}s (attempt ${connectionAttempts})…`,
          );
          setTimeout(connect, delay);
        }
      }

        if (connection === "open") {
      state.set("connected", true);
      state.set("qr", null);
      connectionAttempts = 0;
      logger(`[Bot] ✅ Connected as ${sock.user?.id || "unknown"}`);

      // Auto-Bio Update (Premium Feature)
      const updateBio = async () => {
        if (!state.get("connected")) return;
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const status = `${BOT_NAME} ⚡ Online for ${h}h ${m}m | Memory: ${(process.memoryUsage().rss / 1048576).toFixed(0)}MB`;
        await sock.updateProfileStatus(status).catch(() => {});
      };
      
      updateBio();
      const bioTimer = setInterval(updateBio, 10 * 60 * 1000); // Every 10 mins
      sock.ev.on("connection.update", ({ connection }) => {
        if (connection === "close") clearInterval(bioTimer);
      });

      if (sock.authState?.creds && !sock.authState.creds.registered) {
          sock.authState.creds.registered = true;
          await saveCreds();
        }
      }
    },
  );

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    if (sock.authState?.creds && !sock.authState.creds.registered) return;

    for (const msg of messages) {
      try {
        await routeMessage(msg);
      } catch (err) {
        logger(`[Bot] Uncaught message error: ${err.message}`);
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { onGroupUpdate } = require("./lib/handler");
      if (typeof onGroupUpdate === "function") {
        await onGroupUpdate(sock, update);
      }
    } catch (err) {
      logger(`[Bot] Group update error: ${err.message}`);
    }
  });

  return sock;
}

async function routeMessage(msg) {
  if (!msg?.message) return;
  const from = msg.key.remoteJid;
  if (!from) return;

  const isMe = msg.key.fromMe;
  const sender = isMe
    ? `${(sock.user?.id || "").split(":")[0]}@s.whatsapp.net`
    : msg.key.participant || from;

  const text = (
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.buttonsResponseMessage?.selectedButtonId ||
    msg.message.templateButtonReplyMessage?.selectedId ||
    ""
  ).trim();

  if (
    isMe &&
    !text.startsWith(PREFIX) &&
    !/^\d+$/.test(text) &&
    !msg.message?.listResponseMessage
  )
    return;

  if (from.endsWith("@g.us") && !isMe) {
    const groupData = db.get("groups", from) || {};
    if (groupData.antilink && !isOwner(sender)) {
      const hasLink = /https?:\/\/|wa\.me\/|chat\.whatsapp\.com/i.test(text);
      if (hasLink) {
        try {
          const groupMeta = await sock.groupMetadata(from);
          const botId = `${(sock.user?.id || "").split(":")[0]}@s.whatsapp.net`;
          const botParticipant = groupMeta.participants.find(
            (p) => p.id === botId,
          );
          const isAdmin =
            botParticipant?.admin === "admin" ||
            botParticipant?.admin === "superadmin";

          if (isAdmin) {
            await sock.sendMessage(from, { delete: msg.key });
            await sock.groupParticipantsUpdate(from, [sender], "remove");
          } else {
            await sock.sendMessage(from, {
              text: `⚠️ Anti-link is enabled, but I am not an Admin! Please make me an Admin to remove links.`,
            });
          }
        } catch (err) {
          logger(`[Bot] Anti-link error: ${err.message}`);
        }
        return;
      }
    }
  }

  await handleCommand(sock, msg, from, text);
}

module.exports = { startBot, getSock: () => sock };
