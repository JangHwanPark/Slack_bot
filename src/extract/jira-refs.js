/** 지라 이슈 키 형태. 예: QA-1234, ANDROID-12 */
const ISSUE_KEY_PATTERN = /\b([A-Z][A-Z0-9_]+-\d+)\b/g;

/** 지라 브라우즈 URL. 예: https://team.atlassian.net/browse/QA-1234 */
const BROWSE_URL_PATTERN = /(https?:\/\/[^\s<>()[\]"']+)\/browse\/([A-Z][A-Z0-9_]+-\d+)/g;

/**
 * 텍스트에서 지라 이슈 참조를 뽑는다.
 * URL로 적힌 것을 먼저 수집해 baseUrl을 확보하고, 본문에 키만 적힌 것도 추가한다.
 *
 * @returns {Array<{key: string, url: string|null, baseUrl: string|null}>} 키 기준 중복 제거된 목록
 */
function extractJiraRefs(text) {
    const refsByKey = new Map();

    for (const [, baseUrl, key] of text.matchAll(BROWSE_URL_PATTERN)) {
        refsByKey.set(key, { key, url: `${baseUrl}/browse/${key}`, baseUrl });
    }

    for (const [, key] of text.matchAll(ISSUE_KEY_PATTERN)) {
        if (!refsByKey.has(key)) {
            refsByKey.set(key, { key, url: null, baseUrl: null });
        }
    }

    return [...refsByKey.values()];
}

module.exports = { extractJiraRefs };
