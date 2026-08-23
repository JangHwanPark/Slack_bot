const DEFAULT_TIMEOUT_MS = 5000;
const MAX_DETAIL_LENGTH = 60;

/**
 * 헬스 응답 본문에서 뽑아볼 필드.
 * 서버마다 이름이 달라 후보를 여러 개 두고 먼저 있는 것을 쓴다.
 * 회사 헬스 엔드포인트 형태가 확인되면 여기에 키를 추가하면 된다.
 */
const DETAIL_FIELDS = [
    { label: '버전', keys: ['version', 'appVersion', 'app_version'] },
    { label: '빌드', keys: ['build', 'buildNumber', 'build_number'] },
    { label: '커밋', keys: ['commit', 'revision', 'gitCommit'] },
    { label: '환경', keys: ['env', 'environment', 'profile'] },
    { label: '상태', keys: ['status', 'state'] },
];

function truncate(value) {
    const text = String(value);
    return text.length > MAX_DETAIL_LENGTH ? `${text.slice(0, MAX_DETAIL_LENGTH - 3)}...` : text;
}

/** 헬스 응답이 JSON이면 알 만한 필드를 뽑고, 아니면 아무것도 뽑지 않는다. */
async function readDetails(response) {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        return [];
    }

    try {
        const body = await response.json();

        return DETAIL_FIELDS.map((field) => {
            const key = field.keys.find((candidate) => body[candidate] !== undefined);
            return key ? { label: field.label, value: truncate(body[key]) } : null;
        }).filter(Boolean);
    } catch {
        return [];
    }
}

function describeError(error) {
    if (error.name === 'TimeoutError') {
        return '응답 시간 초과';
    }
    if (error.cause && error.cause.code) {
        return `${error.cause.code} (접속 실패)`;
    }
    return error.message;
}

/**
 * 서버 하나의 상태를 확인한다. 예외를 던지지 않고 항상 결과 객체를 돌려준다.
 *
 * state는 다음 넷 중 하나다.
 *   up           : 정상 응답 (2xx)
 *   down         : 응답은 왔지만 실패 상태 코드
 *   unreachable  : 접속 자체가 안 됨
 *   unconfigured : 주소가 설정되지 않음
 */
async function checkServer(server, timeoutMs = DEFAULT_TIMEOUT_MS) {
    if (!server.healthUrl) {
        return { ...server, state: 'unconfigured' };
    }

    const startedAt = Date.now();

    try {
        const response = await fetch(server.healthUrl, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(timeoutMs),
        });

        return {
            ...server,
            state: response.ok ? 'up' : 'down',
            httpStatus: response.status,
            responseTimeMs: Date.now() - startedAt,
            details: await readDetails(response),
        };
    } catch (error) {
        return {
            ...server,
            state: 'unreachable',
            responseTimeMs: Date.now() - startedAt,
            error: describeError(error),
        };
    }
}

/** 여러 서버를 동시에 확인한다. 느린 서버 하나가 전체를 지연시키지 않게 한다. */
function checkServers(servers, timeoutMs) {
    return Promise.all(servers.map((server) => checkServer(server, timeoutMs)));
}

module.exports = { checkServer, checkServers };
