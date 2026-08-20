require('dotenv').config();

const REQUIRED_ENV_KEYS = ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN'];

function loadConfig() {
    const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
        throw new Error(`필수 환경변수가 없습니다: ${missingKeys.join(', ')}`);
    }

    return {
        botToken: process.env.SLACK_BOT_TOKEN,
        appToken: process.env.SLACK_APP_TOKEN,
    };
}

module.exports = { loadConfig };
