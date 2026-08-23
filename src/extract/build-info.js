const { extractFields } = require('./field-extractor');
const { BUILD_FIELD_RULES, TEST_REQUEST_SUBJECT_PATTERNS } = require('./rules');

/** 메일 본문에서 빌드 정보를 뽑는다. 찾지 못한 필드는 키 자체가 없다. */
function extractBuildInfo(text) {
    return extractFields(text, BUILD_FIELD_RULES);
}

/** 슬랙 카드에 뿌리기 좋게 [{ label, value }] 형태로 바꾼다. */
function toBuildInfoEntries(buildInfo) {
    return BUILD_FIELD_RULES.filter((rule) => buildInfo[rule.field]).map((rule) => ({
        field: rule.field,
        label: rule.label,
        value: buildInfo[rule.field],
    }));
}

function hasBuildInfo(buildInfo) {
    return Object.keys(buildInfo).length > 0;
}

/** 제목 기준으로 테스트 요청 메일인지 판별한다. */
function isTestRequestSubject(subject) {
    return TEST_REQUEST_SUBJECT_PATTERNS.some((pattern) => pattern.test(subject || ''));
}

module.exports = { extractBuildInfo, toBuildInfoEntries, hasBuildInfo, isTestRequestSubject };
