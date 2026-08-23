/**
 * 추출 규칙 확인 스크립트.
 *
 * 회사 메일을 텍스트로 저장한 뒤 이 스크립트로 돌려보면
 * src/extract/rules.js 의 규칙이 어떤 값을 잡아내는지 바로 볼 수 있다.
 * 슬랙이나 Gmail 연결 없이 규칙만 다듬을 때 쓴다.
 *
 * 사용법: node scripts/extract-preview.js fixtures/mails/sample-test-request.txt
 */
const fs = require('fs');
const path = require('path');

const { parseFixture } = require('../src/mail/fixture-source');
const { extractBuildInfo, toBuildInfoEntries, isTestRequestSubject } = require('../src/extract/build-info');
const { extractJiraRefs } = require('../src/extract/jira-refs');
const { BUILD_FIELD_RULES } = require('../src/extract/rules');

function printSection(title) {
    console.log(`\n=== ${title} ===`);
}

function main() {
    const [filePath] = process.argv.slice(2);

    if (!filePath) {
        console.error('사용법: node scripts/extract-preview.js <메일 텍스트 파일>');
        process.exit(1);
    }

    const absolutePath = path.resolve(filePath);
    const mail = parseFixture(absolutePath, fs.readFileSync(absolutePath, 'utf8'));

    printSection('메일');
    console.log(`제목: ${mail.subject}`);
    console.log(`보낸 사람: ${mail.from}`);
    console.log(`테스트 요청으로 인식: ${isTestRequestSubject(mail.subject) ? '예' : '아니오'}`);

    const build = extractBuildInfo(mail.body);
    const found = toBuildInfoEntries(build);
    const missing = BUILD_FIELD_RULES.filter((rule) => !build[rule.field]);

    printSection(`빌드 정보 (${found.length}/${BUILD_FIELD_RULES.length})`);
    found.forEach((entry) => console.log(`  ${entry.label}: ${entry.value}`));

    if (missing.length > 0) {
        console.log(`  찾지 못함: ${missing.map((rule) => rule.label).join(', ')}`);
    }

    const refs = extractJiraRefs(`${mail.subject}\n${mail.body}`);

    printSection(`지라 참조 (${refs.length})`);
    refs.forEach((ref) => console.log(`  ${ref.key} ${ref.url || '(본문에 링크 없음)'}`));

    console.log('');
}

main();
