const logger = require('../lib/logger');
const { extractBuildInfo, isTestRequestSubject } = require('../extract/build-info');
const { extractJiraRefs } = require('../extract/jira-refs');

/**
 * 메일 한 통을 슬랙에 뿌릴 수 있는 테스트 요청 객체로 만든다.
 *
 * 지라 조회는 실패해도 전체를 막지 않는다.
 * 조회에 실패하면 본문에서 찾은 링크와 키만 담아 그대로 알린다.
 */
function createTestRequestPipeline({ jiraClient }) {
    function toUnresolved(ref, reason) {
        return { key: ref.key, url: ref.url, resolved: false, reason };
    }

    async function resolveIssue(ref) {
        if (!jiraClient.enabled) {
            return toUnresolved(ref, 'disabled');
        }

        try {
            const issue = await jiraClient.fetchIssue(ref.key);
            return issue || toUnresolved(ref, 'not-found');
        } catch (error) {
            logger.warn(`지라 이슈 조회에 실패해 링크만 표시합니다 (${ref.key}): ${error.message}`);
            return toUnresolved(ref, 'error');
        }
    }

    async function process(mail) {
        const searchText = `${mail.subject}\n${mail.body}`;

        const build = extractBuildInfo(mail.body);
        const refs = extractJiraRefs(searchText);
        const issues = await Promise.all(refs.map(resolveIssue));

        return {
            mail,
            build,
            issues: issues.map((issue) => ({ resolved: true, ...issue })),
        };
    }

    /** 소스가 넘긴 메일 중 테스트 요청으로 볼 것만 남긴다. */
    function filterTestRequests(mails) {
        return mails.filter((mail) => isTestRequestSubject(mail.subject));
    }

    return { process, filterTestRequests };
}

module.exports = { createTestRequestPipeline };
