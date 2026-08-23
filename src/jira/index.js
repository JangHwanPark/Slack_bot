const { createJiraRestClient } = require('./rest-client');

function basicAuthHeader(email, apiToken) {
    return `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
}

/** 지라를 아직 연결하지 않았을 때 쓰는 빈 구현. 본문에서 찾은 링크만 그대로 노출된다. */
function createNullJiraClient() {
    return { enabled: false, fetchIssue: async () => null };
}

/**
 * 설정에 따라 지라 클라이언트를 만든다.
 *
 * cloud  : REST v3, 이메일 + API 토큰 베이직 인증
 * server : REST v2, PAT 베어러 인증 (이메일을 주면 베이직으로 전환)
 * none   : 조회하지 않음
 */
function createJiraClient(jiraConfig) {
    if (jiraConfig.type === 'none') {
        return createNullJiraClient();
    }

    const { baseUrl, email, apiToken } = jiraConfig;

    if (jiraConfig.type === 'cloud') {
        return createJiraRestClient({
            baseUrl,
            apiVersion: '3',
            authHeader: basicAuthHeader(email, apiToken),
        });
    }

    return createJiraRestClient({
        baseUrl,
        apiVersion: '2',
        authHeader: email ? basicAuthHeader(email, apiToken) : `Bearer ${apiToken}`,
    });
}

module.exports = { createJiraClient };
