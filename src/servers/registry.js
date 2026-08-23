/**
 * 봇이 알고 있는 서버 이름 목록.
 * 서버를 추가하려면 여기에 이름을 넣고 .env 에 SERVER_<이름>_URL 을 채우면 된다.
 * 커맨드 이름과 설정 키가 모두 이 목록에서 파생된다.
 */
const SERVER_NAMES = ['beta', 'beta2', 'hotfix'];

module.exports = { SERVER_NAMES };
