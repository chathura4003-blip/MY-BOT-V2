"use strict";

const { sendReact, isOwner, truncate } = require("../utils");
const msgMgr = require("../message-manager");
const { loadCommands } = require("../handler");
const { getYtdlp } = require("../ytdlp-manager");
const { logger } = require("../../logger");
const db = require("../db");

module.exports = {
  name: "reload",
  aliases: ["broadcast", "ban", "unban", "block", "unblock", "listban", "update", "autoview", "autoreact"],
  description: "Owner-only commands",

  async execute(sock, msg, from, args) {
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!isOwner(sender)) {
      return msgMgr.sendTemp(sock, from, "❌ Owner only.", 4000);
    }

    const cmdText =
      msg?.message?.conversation ||
      msg?.message?.extendedTextMessage?.text ||
      "";
    const cmd = cmdText.trim().toLowerCase().split(/\s+/)[0].slice(1);

    switch (cmd) {
      case "reload": {
        try {
          loadCommands();
          await msgMgr.send(sock, from, { text: "♻️ Commands reloaded successfully." });
          await sendReact(sock, from, msg, "✅");
        } catch (err) {
          await msgMgr.sendTemp(sock, from, `❌ Reload failed: ${err.message.slice(0, 80)}`, 7000);
          await sendReact(sock, from, msg, "❌");
        }
        break;
      }

      case "broadcast": {
        const text = args.join(" ").trim();
        if (!text)
          return msgMgr.sendTemp(sock, from, "⚠️ Provide a message to broadcast.", 5000);
        try {
          const groups = await sock.groupFetchAllParticipating();
          const jids = Object.keys(groups || {});
          for (const jid of jids) {
            let reply = `┌── ⋆⋅☆⋅⋆ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ⋆⋅☆⋅⋆ ──┐\n`;
            reply += `│   »»——  ʙʀᴏᴀᴅᴄᴀsᴛ  ——««  │\n`;
            reply += `└────────────────────────────┘\n\n`;
            reply += ` ╭━━ ❨ 👤 ᴘʀᴏғɪʟᴇ ❩ ━━\n`;
            reply += ` ┃ ⌕ ᴜsᴇʀ : @${sender.split('@')[0]}\n`;
            reply += ` ╰━━━━━━━━━━━━━━━\n\n`;
            reply += `  【 ☁️ ᴀɴɴᴏᴜɴᴄᴇᴍᴇɴᴛ 】\n`;
            reply += `  ► ${truncate(text, 1000)}\n\n`;
            reply += ` 🌸 ⋆｡°✩ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ✩°｡⋆ 🌸`;
            await sock.sendMessage(jid, { text: reply, mentions: [sender], contextInfo: { isForwarded: true, forwardingScore: 999 } });
            await new Promise((r) => setTimeout(r, 1500));
          }
          await msgMgr.send(sock, from, { text: `✅ Broadcast sent to ${jids.length} groups.` });
          await sendReact(sock, from, msg, "✅");
        } catch (err) {
          await msgMgr.sendTemp(sock, from, `❌ Broadcast failed: ${err.message.slice(0, 60)}`, 7000);
        }
        break;
      }

      case "ban": {
        const mentioned =
          msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target =
          mentioned[0] ||
          (args[0] ? `${args[0].replace(/\D/g, "")}@s.whatsapp.net` : null);
        if (!target)
          return msgMgr.sendTemp(sock, from, "⚠️ Mention a user to ban.", 5000);
        db.update("bans", target, { banned: true, at: Date.now() });
        let reply = `┌── ⋆⋅☆⋅⋆ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ⋆⋅☆⋅⋆ ──┐\n`;
        reply += `│   »»——  ᴜsᴇʀ ʙᴀɴɴᴇᴅ  ——««  │\n`;
        reply += `└────────────────────────────┘\n\n`;
        reply += ` ╭━━ ❨ 👤 ᴘʀᴏғɪʟᴇ ❩ ━━\n`;
        reply += ` ┃ ⌕ ᴜsᴇʀ   : @${sender.split('@')[0]}\n`;
        reply += ` ┃ ⌕ ᴛᴀʀɢᴇᴛ : @${target.split('@')[0]}\n`;
        reply += ` ╰━━━━━━━━━━━━━━━\n\n`;
        reply += `  【 ☁️ ᴀᴄᴛɪᴏɴs 】\n`;
        reply += `  ► Status\n`;
        reply += `    ┖ Banned From Bot\n\n`;
        reply += ` 🌸 ⋆｡°✩ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ✩°｡⋆ 🌸`;
        await sock.sendMessage(from, { text: reply, mentions: [sender, target], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
        await sendReact(sock, from, msg, "✅");
        break;
      }

      case "unban": {
        const mentioned =
          msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target =
          mentioned[0] ||
          (args[0] ? `${args[0].replace(/\D/g, "")}@s.whatsapp.net` : null);
        if (!target)
          return msgMgr.sendTemp(sock, from, "⚠️ Mention a user to unban.", 5000);
        db.delete("bans", target);
        let reply = `┌── ⋆⋅☆⋅⋆ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ⋆⋅☆⋅⋆ ──┐\n`;
        reply += `│   »»——  ᴜsᴇʀ ᴜɴʙᴀɴɴᴇᴅ  ——««  │\n`;
        reply += `└────────────────────────────┘\n\n`;
        reply += ` ╭━━ ❨ 👤 ᴘʀᴏғɪʟᴇ ❩ ━━\n`;
        reply += ` ┃ ⌕ ᴜsᴇʀ   : @${sender.split('@')[0]}\n`;
        reply += ` ┃ ⌕ ᴛᴀʀɢᴇᴛ : @${target.split('@')[0]}\n`;
        reply += ` ╰━━━━━━━━━━━━━━━\n\n`;
        reply += `  【 ☁️ ᴀᴄᴛɪᴏɴs 】\n`;
        reply += `  ► Status\n`;
        reply += `    ┖ Access Restored\n\n`;
        reply += ` 🌸 ⋆｡°✩ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ✩°｡⋆ 🌸`;
        await sock.sendMessage(from, { text: reply, mentions: [sender, target], contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
        await sendReact(sock, from, msg, "✅");
        break;
      }

      case "listban": {
        const bans = db.getAll("bans") || {};
        const banned = Object.keys(bans).filter((k) => bans[k]?.banned);
        if (!banned.length)
          return msgMgr.send(sock, from, { text: "✅ No banned users found." });

        let reply = `┌── ⋆⋅☆⋅⋆ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ⋆⋅☆⋅⋆ ──┐\n`;
        reply += `│   »»——  ʙᴀɴɴᴇᴅ ʟɪsᴛ  ——««  │\n`;
        reply += `└────────────────────────────┘\n\n`;
        reply += ` ╭━━ ❨ 👤 ᴘʀᴏғɪʟᴇ ❩ ━━\n`;
        reply += ` ┃ ⌕ ᴜsᴇʀ : @${sender.split('@')[0]}\n`;
        reply += ` ╰━━━━━━━━━━━━━━━\n\n`;
        reply += `  【 ☁️ ᴇɴᴛɪᴛɪᴇs 】\n`;
        banned.forEach((jid, i) => {
          reply += `  ► ${i + 1}. @${jid.split("@")[0]}\n`;
        });
        reply += `\n 🌸 ⋆｡°✩ 𝐂𝐇𝐀𝐓𝐇𝐔 𝐌𝐃 ✩°｡⋆ 🌸`;
        
        const mentions = [sender, ...banned];
        await sock.sendMessage(from, { text: reply, mentions, contextInfo: { isForwarded: true, forwardingScore: 999 } }, { quoted: msg });
        break;
      }

      case "update": {
        try {
          await msgMgr.sendTemp(
            sock,
            from,
            "⏳ Updating yt-dlp binary from official source. Please wait...",
            5000,
          );
          const out = await getYtdlp().execPromise(["-U"]);
          await msgMgr.send(sock, from, {
            text: `✅ *Update Complete*\n\n\`\`\`${out}\`\`\``,
          });
          await sendReact(sock, from, msg, "✅");
        } catch (err) {
          await msgMgr.sendTemp(sock, from, `❌ Update failed: ${err.message}`, 6000);
          await sendReact(sock, from, msg, "❌");
        }
        break;
      }

      case "autoview": {
        const val = args[0]?.toLowerCase();
        if (val !== "on" && val !== "off") {
          return msgMgr.sendTemp(sock, from, "⚠️ Use: .autoview on/off", 5000);
        }
        db.setSetting("auto_view_status", val === "on");
        await msgMgr.send(sock, from, { text: `✅ Auto-View Status is now *${val.toUpperCase()}*` });
        await sendReact(sock, from, msg, "✅");
        break;
      }

      case "autoreact": {
        const val = args[0]?.toLowerCase();
        if (val !== "on" && val !== "off") {
          return msgMgr.sendTemp(sock, from, "⚠️ Use: .autoreact on/off", 5000);
        }
        db.setSetting("auto_react_status", val === "on");
        await msgMgr.send(sock, from, { text: `✅ Auto-React Status is now *${val.toUpperCase()}*` });
        await sendReact(sock, from, msg, "✅");
        break;
      }

      default:
        await msgMgr.sendTemp(sock, from, "❓ Unknown owner command.", 4000);
    }
  },
};
