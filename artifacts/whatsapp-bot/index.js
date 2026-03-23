'use strict';

const { startBot, getSock } = require('./bot');
const { startDashboard } = require('./dashboard');
const { logger } = require('./logger');

process.on('uncaughtException',  err => logger(`[UNCAUGHT]  ${err.message}\n${err.stack}`));
process.on('unhandledRejection', err => logger(`[UNHANDLED] ${err?.message || err}`));

(async () => {
    try {
        startDashboard(getSock);
        await startBot();
    } catch (err) {
        logger(`[Index] Startup error: ${err.message}. Will keep running and retry.`);
        // Do not exit on startup errors - let the bot keep recovering.
        setTimeout(() => {
            startBot().catch((e) => logger(`[Index] Retry error: ${e.message}`));
        }, 5000);
    }
})();
