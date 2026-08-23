/** 조회할 필드. 필요한 것만 요청해 응답 크기를 줄인다. */
const ISSUE_FIELDS = ['summary', 'status', 'assignee', 'priority', 'issuetype'];

function readName(field) {
    return field && field.name ? field.name : null;
}

/**
 * Jira Cloud(v3)와 Server(v2) 응답에서 공통으로 쓰는 부분만 뽑는다.
 * 두 버전 모두 fields.summary / status.name / assignee.displayName 구조는 같다.
 */
function normalizeIssue(raw, baseUrl) {
    const fields = raw.fields || {};

    return {
        key: raw.key,
        url: `${baseUrl}/browse/${raw.key}`,
        summary: fields.summary || null,
        status: readName(fields.status),
        priority: readName(fields.priority),
        issueType: readName(fields.issuetype),
        assignee: fields.assignee ? fields.assignee.displayName : null,
    };
}

module.exports = { normalizeIssue, ISSUE_FIELDS };
