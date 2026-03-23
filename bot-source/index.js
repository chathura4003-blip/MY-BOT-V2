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
        logger(`[Index] Fatal startup error: ${err.message}`);
        process.exit(1);
    }
})();
