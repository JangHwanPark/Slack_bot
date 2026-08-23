const { toBuildInfoEntries } = require('../extract/build-info');

const MAX_HEADER_LENGTH = 150;
const MAX_FIELDS_PER_SECTION = 10;

function truncate(text, maxLength) {
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function formatDateTime(date) {
    return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function buildHeaderBlock(mail) {
    return {
        type: 'header',
        text: { type: 'plain_text', text: truncate(mail.subject || '테스트 요청', MAX_HEADER_LENGTH) },
    };
}

function buildContextBlock(mail) {
    return {
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `보낸 사람: ${mail.from} | 수신: ${formatDateTime(mail.receivedAt)} | <${mail.permalink}|메일 열기>`,
            },
        ],
    };
}

/** 빌드 정보를 두 칸짜리 필드로 배치한다. 값이 없는 항목은 애초에 목록에 없다. */
function buildBuildInfoBlock(build) {
    const entries = toBuildInfoEntries(build);

    if (entries.length === 0) {
        return {
            type: 'section',
            text: { type: 'mrkdwn', text: '*빌드 정보*\n본문에서 빌드 정보를 찾지 못했습니다.' },
        };
    }

    return {
        type: 'section',
        fields: entries.slice(0, MAX_FIELDS_PER_SECTION).map((entry) => ({
            type: 'mrkdwn',
            text: `*${entry.label}*\n${entry.value}`,
        })),
    };
}

/** 이슈 상세를 못 채운 이유를 사용자에게 보여줄 문구로 바꾼다. */
const UNRESOLVED_NOTES = {
    disabled: '',
    'not-found': ' (지라에서 찾지 못한 이슈입니다)',
    error: ' (상세 정보를 가져오지 못했습니다)',
};

function formatIssueLine(issue) {
    const title = issue.url ? `<${issue.url}|${issue.key}>` : `\`${issue.key}\``;

    if (!issue.resolved) {
        return `${title}${UNRESOLVED_NOTES[issue.reason] || ''}`;
    }

    const meta = [issue.status, issue.priority, issue.assignee ? `담당 ${issue.assignee}` : null]
        .filter(Boolean)
        .join(' | ');

    return `${title} ${issue.summary || ''}\n${meta}`.trim();
}

function buildIssuesBlock(issues) {
    if (issues.length === 0) {
        return null;
    }

    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*연결된 지라 이슈 (${issues.length})*\n${issues.map(formatIssueLine).join('\n')}`,
        },
    };
}

function buildActionsBlock(build) {
    const links = [
        build.downloadUrl ? { label: '빌드 다운로드', url: build.downloadUrl } : null,
        build.buildUrl ? { label: '빌드 페이지', url: build.buildUrl } : null,
    ].filter(Boolean);

    if (links.length === 0) {
        return null;
    }

    return {
        type: 'actions',
        elements: links.map((link) => ({
            type: 'button',
            text: { type: 'plain_text', text: link.label },
            url: link.url,
        })),
    };
}

/**
 * 테스트 요청 객체를 슬랙 chat.postMessage 인자로 바꾼다.
 * text는 알림 미리보기와 Block Kit 미지원 환경용 대체 문구다.
 */
function renderTestRequest({ mail, build, issues }) {
    const blocks = [
        buildHeaderBlock(mail),
        buildContextBlock(mail),
        buildBuildInfoBlock(build),
        buildIssuesBlock(issues),
        buildActionsBlock(build),
    ].filter(Boolean);

    return {
        text: `테스트 요청: ${mail.subject}`,
        blocks,
    };
}

/** 목록 한 줄에 붙일 요약. 버전과 이슈 건수처럼 구분에 필요한 것만 남긴다. */
function summarize({ build, issues }) {
    const parts = [
        build.version ? `버전 ${build.version}` : null,
        build.environment || null,
        issues.length > 0 ? `이슈 ${issues.length}건` : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' | ') : '추출된 정보 없음';
}

/**
 * 테스트 요청 목록을 한 메시지로 만든다.
 * 앞에 붙는 번호는 `/qa show <번호>` 에 그대로 쓴다.
 */
function renderTestRequestList(requests, showCommand) {
    if (requests.length === 0) {
        return { text: '검색 조건에 맞는 테스트 요청 메일이 없습니다.' };
    }

    const lines = requests.map(
        (request, index) =>
            `\`${index + 1}\`  ${request.mail.subject}\n     ${summarize(request)}`,
    );

    return {
        text: `최근 테스트 요청 ${requests.length}건`,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*최근 테스트 요청 ${requests.length}건*\n${lines.join('\n')}`,
                },
            },
            {
                type: 'context',
                elements: [{ type: 'mrkdwn', text: `상세를 보려면 \`${showCommand} <번호>\`` }],
            },
        ],
    };
}

module.exports = { renderTestRequest, renderTestRequestList };
