'use strict';

const express = require('express');
const os = require('os');
const si = require('systeminformation');
const state = require('./state');
const { clearSession } = require('./session-manager');
const { logger, getLogs } = require('./logger');
const { BOT_NAME, PREFIX, PORT, OWNER_NUMBER, AUTO_READ, AUTO_TYPING, NSFW_ENABLED, PREMIUM_CODE } = require('./config');
const db = require('./lib/db');

let _prevNet = null;
let _speed = { dlKbps: 0, ulKbps: 0, totalDlMB: 0, totalUlMB: 0 };
let _sessionStartRx = null;
let _sessionStartTx = null;
let commandsToday = 0;
let messagesHandled = 0;

async function _sampleNet() {
    try {
        const nets = await si.networkStats();
        const iface = nets.find(n => n.iface !== 'lo') || nets[0];
        if (!iface) return;
        if (_sessionStartRx === null) {
            _sessionStartRx = iface.rx_bytes;
            _sessionStartTx = iface.tx_bytes;
        }
        if (_prevNet) {
            const dlBytes = Math.max(0, iface.rx_sec ?? ((iface.rx_bytes - _prevNet.rx_bytes)));
            const ulBytes = Math.max(0, iface.tx_sec ?? ((iface.tx_bytes - _prevNet.tx_bytes)));
            _speed = {
                dlKbps: (dlBytes / 1024).toFixed(1),
                ulKbps: (ulBytes / 1024).toFixed(1),
                totalDlMB: ((iface.rx_bytes - _sessionStartRx) / (1024 * 1024)).toFixed(2),
                totalUlMB: ((iface.tx_bytes - _sessionStartTx) / (1024 * 1024)).toFixed(2),
            };
        }
        _prevNet = { rx_bytes: iface.rx_bytes, tx_bytes: iface.tx_bytes };
    } catch { }
}
setInterval(_sampleNet, 2000).unref();
_sampleNet();

// Track command usage
exports.trackCommand = () => { commandsToday++; messagesHandled++; };
exports.trackMessage = () => { messagesHandled++; };

function createDashboard(getSock) {
    const app = express();
    app.use(express.json());

    // Internal API — no auth here (api-server handles JWT auth before proxying)
    const router = express.Router();

    router.get('/status', (req, res) => {
        const sock = getSock?.();
        const connected = state.get('connected') ?? false;
        const user = sock?.user?.id || null;
        const number = user ? user.split(':')[0].split('@')[0] : state.getNumber();
        const memTotal = os.totalmem();
        const memFree = os.freemem();
        const memUsed = memTotal - memFree;
        res.json({
            connected,
            status: connected ? 'Connected' : 'Disconnected',
            number: number || null,
            user: user,
            connectedAt: state.getConnectedAt(),
            uptime: Math.floor(process.uptime()),
            memUsed: Math.round(memUsed / 1024 / 1024),
            memTotal: Math.round(memTotal / 1024 / 1024),
            memPercent: Math.round((memUsed / memTotal) * 100),
            cpuLoad: os.loadavg()[0].toFixed(2),
            platform: os.platform(),
            nodeVersion: process.version,
            commandsToday,
            messagesHandled,
            net: {
                speedRx: `${_speed.dlKbps} KB/s`,
                speedTx: `${_speed.ulKbps} KB/s`,
                totalRx: `${_speed.totalDlMB} MB`,
                totalTx: `${_speed.totalUlMB} MB`,
            },
        });
    });

    router.get('/qr', (req, res) => {
        const qr = state.get('qr');
        res.json({ qr: qr || null, connected: state.get('connected') ?? false });
    });

    router.get('/logs', (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        const raw = getLogs?.() || [];
        const logs = raw.slice(-limit).reverse().map((msg, i) => {
            const level = msg.includes('[WARN]') || msg.includes('warn') ? 'warn'
                : msg.includes('[ERR]') || msg.includes('error') || msg.includes('Error') ? 'error'
                : msg.includes('[DEBUG]') ? 'debug' : 'info';
            return {
                id: `log-${i}-${Date.now()}`,
                timestamp: new Date().toISOString(),
                level,
                message: msg,
                meta: null,
            };
        });
        res.json(logs);
    });

    router.get('/settings', (req, res) => {
        const dbSettings = db.getAll('settings') || {};
        res.json({
            botName: dbSettings.botName || BOT_NAME,
            prefix: dbSettings.prefix || PREFIX,
            ownerNumber: dbSettings.ownerNumber || OWNER_NUMBER,
            autoRead: dbSettings.autoRead !== undefined ? dbSettings.autoRead : AUTO_READ,
            autoTyping: dbSettings.autoTyping !== undefined ? dbSettings.autoTyping : AUTO_TYPING,
            nsfwEnabled: dbSettings.nsfwEnabled !== undefined ? dbSettings.nsfwEnabled : NSFW_ENABLED,
            premiumCode: dbSettings.premiumCode || PREMIUM_CODE,
            maintenanceMode: dbSettings.maintenanceMode || false,
            maxSessions: dbSettings.maxSessions || 5,
        });
    });

    router.post('/settings', (req, res) => {
        const { botName, prefix, ownerNumber, autoRead, autoTyping, nsfwEnabled, premiumCode, maintenanceMode, maxSessions } = req.body || {};
        const db = require('./lib/db');
        if (botName !== undefined) db.setSetting('botName', botName);
        if (prefix !== undefined) db.setSetting('prefix', prefix);
        if (ownerNumber !== undefined) db.setSetting('ownerNumber', ownerNumber);
        if (autoRead !== undefined) db.setSetting('autoRead', autoRead);
        if (autoTyping !== undefined) db.setSetting('autoTyping', autoTyping);
        if (nsfwEnabled !== undefined) db.setSetting('nsfwEnabled', nsfwEnabled);
        if (premiumCode !== undefined) db.setSetting('premiumCode', premiumCode);
        if (maintenanceMode !== undefined) db.setSetting('maintenanceMode', maintenanceMode);
        if (maxSessions !== undefined) db.setSetting('maxSessions', maxSessions);
        logger('[Dashboard] Settings updated via admin panel');
        res.json({ ok: true });
    });

    router.get('/users', (req, res) => {
        const users = db.getAll('users') || {};
        const list = Object.entries(users).map(([jid, data]) => ({
            jid,
            number: jid.split('@')[0],
            name: data.name || null,
            premium: data.premium || false,
            banned: data.banned || false,
            registeredAt: data.registeredAt || null,
        }));
        res.json({ users: list, count: list.length });
    });

    router.get('/mods', (req, res) => {
        const mods = db.getAll('mods') || {};
        const list = Object.entries(mods)
            .filter(([, v]) => v?.mod)
            .map(([jid, v]) => ({ jid, number: jid.split('@')[0], addedAt: v.addedAt || null }));
        res.json({ mods: list });
    });

    router.post('/mods', (req, res) => {
        const { number } = req.body || {};
        if (!number) return res.status(400).json({ error: 'number required' });
        const jid = `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        db.update('mods', jid, { mod: true, addedAt: Date.now() });
        logger(`[Dashboard] Mod added: ${jid}`);
        res.json({ ok: true, jid });
    });

    router.delete('/mods/:jid', (req, res) => {
        const jid = decodeURIComponent(req.params.jid);
        db.delete('mods', jid);
        logger(`[Dashboard] Mod removed: ${jid}`);
        res.json({ ok: true });
    });

    router.get('/bans', (req, res) => {
        const bans = db.getAll('bans') || {};
        const list = Object.entries(bans)
            .filter(([, v]) => v?.banned)
            .map(([jid, v]) => ({ jid, number: jid.split('@')[0], bannedAt: v.at || null }));
        res.json({ bans: list });
    });

    router.post('/bans', (req, res) => {
        const { number } = req.body || {};
        if (!number) return res.status(400).json({ error: 'number required' });
        const jid = `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        db.update('bans', jid, { banned: true, at: Date.now() });
        logger(`[Dashboard] Ban added: ${jid}`);
        res.json({ ok: true, jid });
    });

    router.delete('/bans/:jid', (req, res) => {
        const jid = decodeURIComponent(req.params.jid);
        db.delete('bans', jid);
        logger(`[Dashboard] Ban removed: ${jid}`);
        res.json({ ok: true });
    });

    router.post('/broadcast', async (req, res) => {
        const sock = getSock?.();
        if (!sock) return res.status(400).json({ error: 'Bot not connected' });
        const { message, targets } = req.body || {};
        if (!message) return res.status(400).json({ error: 'message required' });

        let jids = Array.isArray(targets) && targets.length ? targets : Object.keys(db.getAll('users') || {});
        const results = { sent: 0, failed: 0, total: jids.length, errors: [] };

        for (const jid of jids.slice(0, 50)) {
            try {
                await sock.sendMessage(jid, { text: message });
                results.sent++;
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                results.failed++;
                results.errors.push({ jid, error: e.message });
            }
        }
        logger(`[Dashboard] Broadcast: ${results.sent}/${results.total} sent`);
        res.json(results);
    });

    router.post('/pairing-code', async (req, res) => {
        const sock = getSock?.();
        if (!sock) return res.status(503).json({ error: 'Bot not running — start the bot first' });
        if (state.get('connected')) return res.status(400).json({ error: 'Bot is already connected. Logout first to re-link.' });
        const { phoneNumber } = req.body || {};
        if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber is required' });
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length < 7 || cleaned.length > 15) return res.status(400).json({ error: 'Invalid phone number' });
        try {
            const code = await sock.requestPairingCode(cleaned);
            logger(`[Dashboard] Pairing code requested for ${cleaned}`);
            res.json({ ok: true, code });
        } catch (e) {
            logger(`[Dashboard] Pairing code error: ${e.message}`);
            res.status(500).json({ error: e.message || 'Failed to generate pairing code' });
        }
    });

    router.post('/restart', (req, res) => {
        res.json({ ok: true, message: 'Restarting CHATHU MD…' });
        logger('[Dashboard] Restart requested via admin panel.');
        setTimeout(() => process.exit(0), 1500);
    });

    router.post('/logout', (req, res) => {
        clearSession();
        res.json({ ok: true, message: 'Session cleared. Reconnecting…' });
        logger('[Dashboard] Logout requested via admin panel.');
        setTimeout(() => process.exit(0), 1500);
    });

    app.use('/bot-internal', router);

    return app;
}

function startDashboard(getSock) {
    const app = createDashboard(getSock);
    const port = parseInt(process.env.BOT_INTERNAL_PORT) || 9091;
    app.listen(port, '127.0.0.1', () => {
        logger(`[Dashboard] Internal API running on port ${port}`);
    });
    return app;
}

module.exports = { startDashboard };
