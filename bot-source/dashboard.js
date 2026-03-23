'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const si = require('systeminformation');
const state = require('./state');
const { clearSession } = require('./session-manager');
const { logger, getLogs } = require('./logger');
const { ADMIN_USER, ADMIN_PASS, DASHBOARD_PORT } = require('./config');
const db = require('./lib/db');

let _prevNet = null;
let _speed = { dlKbps: 0, ulKbps: 0, totalDlMB: 0, totalUlMB: 0 };
let _sessionStartRx = null;
let _sessionStartTx = null;

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
            const dt = 1; // 1 second interval
            const dlBytes = Math.max(0, iface.rx_sec ?? ((iface.rx_bytes - _prevNet.rx_bytes) / dt));
            const ulBytes = Math.max(0, iface.tx_sec ?? ((iface.tx_bytes - _prevNet.tx_bytes) / dt));

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
setInterval(_sampleNet, 1000).unref();
_sampleNet();

function createDashboard(getSock) {
    const app = express();
    app.use(express.json());

    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/bot-panel', express.static(path.join(__dirname, 'public')));

    function requireAuth(req, res, next) {
        const authHeader = req.headers.authorization || '';
        const b64 = authHeader.startsWith('Basic ') ? authHeader.slice(6) : '';
        if (!b64) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const decoded = Buffer.from(b64, 'base64').toString();
        const colonIdx = decoded.indexOf(':');
        const user = decoded.slice(0, colonIdx);
        const pass = decoded.slice(colonIdx + 1);
        if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        next();
    }

    const router = express.Router();

    router.get('/api/status', requireAuth, (req, res) => {
        const sock = getSock?.();
        res.json({
            connected: state.get('connected') ?? false,
            uptime: Math.floor(process.uptime()),
            user: sock?.user?.id || null,
            memory: `${(process.memoryUsage().rss / 1048576).toFixed(1)} MB`,
        });
    });

    router.get('/api/qr', requireAuth, (req, res) => {
        const qr = state.get('qr');
        res.json({ qr: qr || null, connected: state.get('connected') ?? false });
    });

    router.get('/api/logs', requireAuth, (req, res) => {
        const limit = parseInt(req.query.limit) || 100;
        res.json({ logs: (getLogs?.() || []).slice(-limit) });
    });

    router.get('/api/speed', requireAuth, (req, res) => {
        res.json(_speed);
    });

    router.get('/api/mods', requireAuth, (req, res) => {
        const mods = db.getAll('mods') || {};
        const list = Object.entries(mods)
            .filter(([, v]) => v?.mod)
            .map(([jid, v]) => ({ jid, number: jid.split('@')[0], addedAt: v.addedAt || null }));
        res.json({ mods: list });
    });

    router.post('/api/mods', requireAuth, (req, res) => {
        const { number } = req.body || {};
        if (!number) return res.status(400).json({ error: 'number required' });
        const jid = `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        db.update('mods', jid, { mod: true, addedAt: Date.now() });
        logger(`[Dashboard] Mod added: ${jid}`);
        res.json({ ok: true, jid });
    });

    router.delete('/api/mods/:jid', requireAuth, (req, res) => {
        const jid = decodeURIComponent(req.params.jid);
        db.delete('mods', jid);
        logger(`[Dashboard] Mod removed: ${jid}`);
        res.json({ ok: true });
    });

    router.get('/api/bans', requireAuth, (req, res) => {
        const bans = db.getAll('bans') || {};
        const list = Object.entries(bans)
            .filter(([, v]) => v?.banned)
            .map(([jid, v]) => ({ jid, number: jid.split('@')[0], bannedAt: v.at || null }));
        res.json({ bans: list });
    });

    router.post('/api/bans', requireAuth, (req, res) => {
        const { number } = req.body || {};
        if (!number) return res.status(400).json({ error: 'number required' });
        const jid = `${number.replace(/\D/g, '')}@s.whatsapp.net`;
        db.update('bans', jid, { banned: true, at: Date.now() });
        logger(`[Dashboard] Ban added: ${jid}`);
        res.json({ ok: true, jid });
    });

    router.delete('/api/bans/:jid', requireAuth, (req, res) => {
        const jid = decodeURIComponent(req.params.jid);
        db.delete('bans', jid);
        logger(`[Dashboard] Ban removed: ${jid}`);
        res.json({ ok: true });
    });

    router.post('/api/restart', requireAuth, (req, res) => {
        res.json({ ok: true, message: 'Restarting…' });
        logger('[Dashboard] Restart requested via web panel.');
        setTimeout(() => process.exit(0), 1500);
    });

    router.post('/api/logout', requireAuth, (req, res) => {
        clearSession();
        res.json({ ok: true, message: 'Session cleared. Reconnecting…' });
        logger('[Dashboard] Logout requested via web panel.');
        setTimeout(() => process.exit(0), 1500);
    });

    router.get(['/', '/index.html'], (req, res) => {
        const htmlPath = path.join(__dirname, 'public', 'admin.html');
        if (fs.existsSync(htmlPath)) {
            res.sendFile(htmlPath);
        } else {
            res.send('<h1>Bot Admin Panel</h1><p>public/admin.html not found.</p>');
        }
    });

    app.use('/', router);
    app.use('/bot-panel', router);

    return app;
}

function startDashboard(getSock) {
    const app = createDashboard(getSock);
    const port = parseInt(process.env.PORT) || DASHBOARD_PORT;
    app.listen(port, '0.0.0.0', () => {
        logger(`[Dashboard] Running on http://0.0.0.0:${port}`);
    });
    return app;
}

module.exports = { startDashboard };
