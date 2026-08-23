/**
 * Gmail 연결 확인 스크립트.
 *
 * 실제 메일함을 MAIL_QUERY로 검색해 어떤 메일이 잡히고
 * 각 메일에서 무엇이 추출되는지 보여준다. 슬랙에는 아무것도 보내지 않는다.
 *
 * 사용법: node scripts/gmail-dry-run.js
 */
require('dotenv').config({ quiet: true });

const { loadConfig } = require('../src/config');
const { createMailSource } = require('../src/mail');
const { createJiraClient } = require('../src/jira');
const { createTestRequestPipeline } = require('../src/pipeline/test-request');
const { toBuildInfoEntries } = require('../src/extract/build-info');
const { BUILD_FIELD_RULES } = require('../src/extract/rules');

function printTestRequest({ mail, build, issues }) {
    const entries = toBuildInfoEntries(build);

    console.log(`\n--- ${mail.subject}`);
    console.log(`    보낸 사람: ${mail.from}`);
    console.log(`    빌드 정보 (${entries.length}/${BUILD_FIELD_RULES.length})`);
    entries.forEach((entry) => console.log(`      ${entry.label}: ${entry.value}`));
    console.log(`    지라 참조 (${issues.length})`);
    issues.forEach((issue) => console.log(`      ${issue.key} ${issue.summary || ''}`));
}

async function main() {
    const config = loadConfig();
    const mailSource = createMailSource(config.mail);
    const pipeline = createTestRequestPipeline({ jiraClient: createJiraClient(config.jira) });

    console.log(`메일 소스: ${config.mail.source}`);
    console.log(`검색 쿼리: ${config.mail.query}`);

    const mails = await mailSource.fetchMessages();
    const targets = pipeline.filterTestRequests(mails);

    console.log(`\n검색 결과 ${mails.length}건, 테스트 요청으로 인식 ${targets.length}건`);

    for (const mail of targets) {
        printTestRequest(await pipeline.process(mail));
    }

    console.log('');
}

main().catch((error) => {
    console.error(`실패: ${error.message}`);
    process.exit(1);
});
