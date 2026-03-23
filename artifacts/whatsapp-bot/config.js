'use strict';

const path = require('path');

module.exports = {
    BOT_NAME: process.env.BOT_NAME || 'CHATHU MD',
    OWNER_NUMBER: process.env.OWNER_NUMBER || '94742514900',
    PREFIX: process.env.PREFIX || '.',
    PORT: parseInt(process.env.BOT_INTERNAL_PORT) || 9091,

    ADMIN_USER: process.env.ADMIN_USER || 'admin',
    ADMIN_PASS: process.env.ADMIN_PASS || 'admin123',
    JWT_SECRET: process.env.SESSION_SECRET || 'chathu-md-secret-2024',

    SESSION_DIR: path.join(__dirname, 'session'),
    DOWNLOAD_DIR: path.join(__dirname, 'downloads'),

    BROWSER: ['ChathuMD', 'Chrome', '131.0'],

    AUTO_READ: process.env.AUTO_READ !== 'false',
    AUTO_TYPING: process.env.AUTO_TYPING !== 'false',
    NSFW_ENABLED: process.env.NSFW_ENABLED !== 'false',
    WORK_MODE: process.env.WORK_MODE || 'public',
    PREMIUM_CODE: process.env.PREMIUM_CODE || '',

    SEARCH_CACHE_TTL: 300000,
    DOWNLOAD_CACHE_TTL: 1800000,
    MSG_CACHE_TTL: 3600000,
};
