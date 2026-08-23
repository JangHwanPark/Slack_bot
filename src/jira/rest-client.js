const { normalizeIssue, ISSUE_FIELDS } = require('./issue');

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Jira REST 클라이언트.
 * Cloud와 Server의 차이는 apiVersion과 authHeader뿐이라 호출 로직은 하나로 둔다.
 */
function createJiraRestClient({ baseUrl, apiVersion, authHeader }) {
    async function fetchIssue(key) {
        const url = `${baseUrl}/rest/api/${apiVersion}/issue/${encodeURIComponent(key)}?fields=${ISSUE_FIELDS.join(',')}`;

        const response = await fetch(url, {
            headers: { Authorization: authHeader, Accept: 'application/json' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`지라 조회 실패 (${key}): ${response.status} ${response.statusText}`);
        }

        return normalizeIssue(await response.json(), baseUrl);
    }

    return { enabled: true, fetchIssue };
}

module.exports = { createJiraRestClient };
