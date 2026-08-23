/**
 * 메일 본문에서 값을 뽑아내는 규칙 모음.
 *
 * 회사 메일 양식이 확인되면 이 파일만 수정하면 된다.
 * 다른 코드는 규칙의 내용을 알지 못하고 구조(field/labels/patterns)만 사용한다.
 */

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * '라벨: 값' 형태의 한 줄을 잡는 정규식을 만든다.
 * 라벨 앞에 붙는 목록 기호(-, *, >, 공백)와 콜론 뒤 공백은 무시한다.
 * 전각 콜론(：)도 함께 처리한다.
 */
function labeled(...labels) {
    const alternation = labels.map(escapeRegExp).join('|');
    return new RegExp(`(?:^|\\n)[\\s*_>\\-\\[]*(?:${alternation})[\\s*_\\]]*[:：]\\s*(.+)`, 'i');
}

/** 값이 URL인 줄을 잡는다. 라벨이 없는 양식에 대비한 보조 규칙. */
function urlContaining(...keywords) {
    const alternation = keywords.map(escapeRegExp).join('|');
    return new RegExp(`(https?://[^\\s<>()\\[\\]"']*(?:${alternation})[^\\s<>()\\[\\]"']*)`, 'i');
}

/**
 * 빌드 정보 추출 규칙.
 * patterns는 위에서부터 순서대로 시도하고 처음 맞는 값을 쓴다.
 * label은 슬랙 카드에 표시할 이름이다.
 */
const BUILD_FIELD_RULES = [
    {
        field: 'version',
        label: '버전',
        patterns: [labeled('버전', 'version', 'app version', '앱 버전')],
    },
    {
        field: 'buildNumber',
        label: '빌드',
        patterns: [labeled('빌드', '빌드번호', '빌드 번호', 'build', 'build number', 'build no')],
    },
    {
        field: 'platform',
        label: '플랫폼',
        patterns: [labeled('플랫폼', 'platform', 'os', '대상')],
    },
    {
        field: 'environment',
        label: '환경',
        patterns: [labeled('환경', 'environment', 'env', '서버')],
    },
    {
        field: 'branch',
        label: '브랜치',
        patterns: [labeled('브랜치', 'branch')],
    },
    {
        field: 'commit',
        label: '커밋',
        patterns: [labeled('커밋', 'commit', 'revision', 'sha')],
    },
    {
        field: 'downloadUrl',
        label: '다운로드',
        patterns: [
            labeled('다운로드', '다운로드 링크', 'download', 'download url', 'artifact', '설치'),
            urlContaining('/download/', '.apk', '.ipa', 'testflight', 'appdistribution'),
        ],
    },
    {
        field: 'buildUrl',
        label: '빌드 페이지',
        patterns: [
            labeled('빌드 링크', 'build url', 'ci', 'jenkins', 'pipeline'),
            urlContaining('jenkins', '/job/', 'actions/runs', 'pipelines'),
        ],
    },
];

/**
 * 이 메일이 테스트 요청 메일인지 판별하는 규칙.
 * Gmail 쿼리(MAIL_QUERY)로 1차 필터링하고, 여기서 2차로 걸러낸다.
 */
const TEST_REQUEST_SUBJECT_PATTERNS = [
    /테스트\s*요청/i,
    /테스트\s*해\s*주?세요/i,
    /qa\s*요청/i,
    /test\s*request/i,
    /request\s*for\s*(?:qa|test)/i,
];

module.exports = {
    BUILD_FIELD_RULES,
    TEST_REQUEST_SUBJECT_PATTERNS,
    labeled,
    urlContaining,
};
