const { toBuildInfoEntries } = require('../extract/build-info');

const STATE_LABELS = {
    up: '정상',
    down: '비정상',
    unreachable: '접속 불가',
};

function formatDateTime(date) {
    return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

/** '라벨 : 값' 을 한 줄에 하나씩 쌓는다. 항목이 많아도 한 줄로 뭉치지 않는다. */
function formatEntryLines(entries) {
    return entries.map((entry) => `${entry.label} : ${entry.value}`).join('\n');
}

/** 헬스 응답을 줄 목록으로 바꾼다. 주소가 설정된 서버에서만 쓰인다. */
function formatHealthSection(health) {
    if (health.state === 'unreachable') {
        return `${STATE_LABELS.unreachable} | ${health.error} (${health.responseTimeMs}ms)`;
    }

    const headline = `${STATE_LABELS[health.state]} | HTTP ${health.httpStatus} | ${health.responseTimeMs}ms`;
    const details = formatEntryLines(health.details);

    return details ? `${headline}\n${details}` : headline;
}

/** 테스트 요청 메일에서 뽑은 빌드 정보를 줄 목록으로 바꾼다. */
function formatMailSection(request) {
    const entries = toBuildInfoEntries(request.build);
    const header = `<${request.mail.permalink}|${request.mail.subject}>\n수신 : ${formatDateTime(request.mail.receivedAt)}`;

    if (entries.length === 0) {
        return `${header}\n메일에서 빌드 정보를 찾지 못했습니다.`;
    }

    return `${header}\n${formatEntryLines(entries)}`;
}

/**
 * 서버 응답 버전과 메일이 요청한 버전이 다르면 알린다.
 * 아직 배포되지 않은 빌드를 테스트하는 사고를 막기 위한 것이다.
 */
function findVersionMismatch(health, request) {
    if (!health || !request || health.state !== 'up') {
        return null;
    }

    const runningVersion = (health.details.find((detail) => detail.label === '버전') || {}).value;
    const requestedVersion = request.build.version;

    if (!runningVersion || !requestedVersion || runningVersion === requestedVersion) {
        return null;
    }

    return `실행 중인 버전(${runningVersion})과 메일이 요청한 버전(${requestedVersion})이 다릅니다.`;
}

function buildSectionBlock(text) {
    return { type: 'section', text: { type: 'mrkdwn', text } };
}

/**
 * 서버 한 대의 상태 블록을 만든다.
 *
 * @param {{name: string, health: object|null, request: object|null}} entry
 */
function toBlocks({ name, health, request }) {
    const sections = [];

    // 출처가 둘일 때만 소제목을 붙인다. 메일 하나뿐이면 소제목이 오히려 방해가 된다.
    const label = health ? '*테스트 요청 메일*\n' : '';

    if (health) {
        sections.push(`*서버 응답*\n${formatHealthSection(health)}`);
    }

    if (request) {
        sections.push(`${label}${formatMailSection(request)}`);
    } else {
        sections.push(`${label}${name} 관련 테스트 요청 메일을 찾지 못했습니다.`);
    }

    const mismatch = findVersionMismatch(health, request);

    if (mismatch) {
        sections.push(`*확인 필요*\n${mismatch}`);
    }

    return [buildSectionBlock(`*${name}*`), ...sections.map(buildSectionBlock)];
}

/** 여러 서버의 상태를 하나의 메시지로 만든다. 서버 사이에는 구분선을 넣는다. */
function renderServerStatus(entries) {
    const blocks = entries.flatMap((entry, index) =>
        index === 0 ? toBlocks(entry) : [{ type: 'divider' }, ...toBlocks(entry)],
    );

    return {
        text: `서버 정보 ${entries.map((entry) => entry.name).join(', ')}`,
        blocks: [
            ...blocks,
            {
                type: 'context',
                elements: [{ type: 'mrkdwn', text: `확인 시각 : ${formatDateTime(new Date())}` }],
            },
        ],
    };
}

module.exports = { renderServerStatus, STATE_LABELS };
