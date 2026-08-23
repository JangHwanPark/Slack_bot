const { createSubcommandListener } = require('../lib/subcommand');
const { checkServer } = require('../servers/health-checker');
const { findRequestForServer } = require('../servers/build-lookup');
const { SERVER_NAMES } = require('../servers/registry');
const { renderServerStatus } = require('../slack/server-status-message');

const COMMAND_NAME = '/server';

const USAGE = `사용법: \`${COMMAND_NAME} ${SERVER_NAMES.join('|')}|all\``;

function describeUnknown(subcommand) {
    return `알 수 없는 서버입니다: \`${subcommand}\`\n${USAGE}`;
}

/**
 * 서버 상태 커맨드.
 *
 * 정보 출처가 둘이다.
 *   테스트 요청 메일 : 어떤 빌드를 테스트해달라고 요청받았는지
 *   헬스 응답        : 지금 그 서버가 실제로 무엇을 띄우고 있는지
 *
 * 헬스 주소(.env의 SERVER_<이름>_URL)가 없으면 메일 정보만 보여준다.
 * 사내망 밖이라 서버에 요청을 못 보내는 상황에서도 그대로 쓸 수 있다.
 */
function createServerCommand({ servers, timeoutMs, testRequestService }) {
    function findServer(name) {
        return servers.find((server) => server.name === name);
    }

    async function collectEntry(server, requests) {
        return {
            name: server.name,
            health: server.healthUrl ? await checkServer(server, timeoutMs) : null,
            request: findRequestForServer(requests, server.name),
        };
    }

    async function check(targets) {
        const requests = await testRequestService.fetchAll();
        const entries = await Promise.all(targets.map((server) => collectEntry(server, requests)));

        return renderServerStatus(entries);
    }

    const checkAll = () => check(servers);

    const handlers = {
        // 인자 없이 '/server' 만 친 경우도 전체 확인으로 본다
        '': checkAll,
        all: checkAll,
        ...Object.fromEntries(SERVER_NAMES.map((name) => [name, () => check([findServer(name)])])),
    };

    return {
        name: COMMAND_NAME,
        listener: createSubcommandListener({ handlers, onUnknown: describeUnknown }),
    };
}

module.exports = { createServerCommand, COMMAND_NAME, SERVER_NAMES };
