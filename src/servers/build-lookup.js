/**
 * 서버 이름에 해당하는 테스트 요청을 찾는다.
 *
 * 1순위: 메일에서 뽑은 '환경' 값이 서버 이름과 같은 것
 * 2순위: 제목이나 본문에 서버 이름이 들어간 것
 *
 * requests는 최신순으로 정렬되어 있으므로 먼저 걸리는 것이 가장 최근 요청이다.
 */
function findRequestForServer(requests, serverName) {
    const target = serverName.toLowerCase();

    const byEnvironment = requests.find(
        (request) => (request.build.environment || '').toLowerCase() === target,
    );

    if (byEnvironment) {
        return byEnvironment;
    }

    return (
        requests.find((request) =>
            `${request.mail.subject}\n${request.mail.body}`.toLowerCase().includes(target),
        ) || null
    );
}

module.exports = { findRequestForServer };
