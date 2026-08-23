require('dotenv').config();

const { SERVER_NAMES } = require('./servers/registry');

const MAIL_SOURCES = ['gmail', 'fixture'];
const JIRA_TYPES = ['cloud', 'server', 'none'];

const DEFAULT_MAIL_QUERY = 'is:unread subject:(테스트 요청)';
const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_POLL_INTERVAL_SECONDS = 60;
const DEFAULT_SERVER_TIMEOUT_MS = 5000;

function requireEnv(keys) {
    const missingKeys = keys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
        throw new Error(`필수 환경변수가 없습니다: ${missingKeys.join(', ')}`);
    }
}

function requireOneOf(key, allowedValues, defaultValue) {
    const value = process.env[key] || defaultValue;

    if (!allowedValues.includes(value)) {
        throw new Error(`${key} 값이 잘못되었습니다: ${value} (가능한 값: ${allowedValues.join(', ')})`);
    }

    return value;
}

function readNumber(key, defaultValue) {
    const value = Number(process.env[key]);
    return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

function readBoolean(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    return value.toLowerCase() === 'true';
}

/** 채널 자동 게시를 켤 때만 채널 ID가 필요하다. 커맨드로만 쓸 때는 없어도 된다. */
function loadSlackConfig({ requireNotifyChannel }) {
    requireEnv(['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN']);

    if (requireNotifyChannel) {
        requireEnv(['SLACK_NOTIFY_CHANNEL']);
    }

    return {
        botToken: process.env.SLACK_BOT_TOKEN,
        appToken: process.env.SLACK_APP_TOKEN,
        notifyChannel: process.env.SLACK_NOTIFY_CHANNEL,
    };
}

function loadMailConfig() {
    const source = requireOneOf('MAIL_SOURCE', MAIL_SOURCES, 'gmail');

    if (source === 'gmail') {
        requireEnv(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN']);
    }

    return {
        source,
        query: process.env.MAIL_QUERY || DEFAULT_MAIL_QUERY,
        maxResults: readNumber('MAIL_MAX_RESULTS', DEFAULT_MAX_RESULTS),
        fixtureDir: process.env.MAIL_FIXTURE_DIR || 'fixtures/mails',
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        },
    };
}

function loadJiraConfig() {
    const type = requireOneOf('JIRA_TYPE', JIRA_TYPES, 'none');

    if (type === 'none') {
        return { type };
    }

    requireEnv(['JIRA_BASE_URL', 'JIRA_API_TOKEN']);

    if (type === 'cloud') {
        requireEnv(['JIRA_EMAIL']);
    }

    return {
        type,
        baseUrl: process.env.JIRA_BASE_URL.replace(/\/+$/, ''),
        email: process.env.JIRA_EMAIL,
        apiToken: process.env.JIRA_API_TOKEN,
    };
}

/**
 * 서버별 헬스 체크 주소를 읽는다.
 * 주소는 SERVER_<이름>_URL 규칙으로 넣는다. 예: SERVER_BETA2_URL
 * 값이 없는 서버는 커맨드에서 '주소 미설정'으로 표시된다.
 */
function loadServersConfig() {
    return {
        list: SERVER_NAMES.map((name) => ({
            name,
            healthUrl: process.env[`SERVER_${name.toUpperCase()}_URL`] || null,
        })),
        timeoutMs: readNumber('SERVER_CHECK_TIMEOUT_MS', DEFAULT_SERVER_TIMEOUT_MS),
    };
}

function loadConfig() {
    const pollerEnabled = readBoolean('POLL_ENABLED', false);

    return {
        servers: loadServersConfig(),
        slack: loadSlackConfig({ requireNotifyChannel: pollerEnabled }),
        mail: loadMailConfig(),
        jira: loadJiraConfig(),
        poller: {
            enabled: pollerEnabled,
            intervalMs: readNumber('POLL_INTERVAL_SECONDS', DEFAULT_POLL_INTERVAL_SECONDS) * 1000,
        },
        store: {
            filePath: process.env.SEEN_STORE_PATH || 'data/seen-mails.json',
            maxEntries: readNumber('SEEN_STORE_MAX_ENTRIES', 500),
        },
    };
}

module.exports = { loadConfig };
