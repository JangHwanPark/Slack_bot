const { createSubcommandListener } = require('../lib/subcommand');
const { renderTestRequest, renderTestRequestList } = require('../slack/test-request-message');
const { COMMAND_NAME: SERVER_COMMAND, SERVER_NAMES } = require('./server');

const COMMAND_NAME = '/qa';
const SHOW_COMMAND = `${COMMAND_NAME} show`;

const HELP_MESSAGE = [
    '*사용 가능한 명령어*',
    ...SERVER_NAMES.map((serverName) => `\`${SERVER_COMMAND} ${serverName}\` : ${serverName} 서버 상태 확인`),
    `\`${COMMAND_NAME} latest\` : 가장 최근 테스트 요청 상세 보기`,
    `\`${COMMAND_NAME} list\` : 최근 테스트 요청 목록`,
    `\`${SHOW_COMMAND} <번호>\` : 목록에서 고른 요청 상세 보기`,
    `\`${COMMAND_NAME} refresh\` : 메일을 다시 읽고 목록 보기`,
    `\`${COMMAND_NAME} help\` : 이 도움말 보기`,
].join('\n');

const EMPTY_MESSAGE = '검색 조건에 맞는 테스트 요청 메일이 없습니다.';

/** '/qa show 2' 에서 번호만 뽑는다. */
function parsePosition(commandText) {
    const [, argument] = (commandText || '').trim().split(/\s+/);
    const position = Number(argument);

    return Number.isInteger(position) && position > 0 ? position : null;
}

/**
 * @param {ReturnType<import('../service/test-request-service').createTestRequestService>} testRequestService
 */
function createQaCommand({ testRequestService }) {
    async function showLatest() {
        const request = await testRequestService.fetchLatest();
        return request ? renderTestRequest(request) : EMPTY_MESSAGE;
    }

    async function showList(options) {
        const requests = await testRequestService.fetchAll(options);
        return renderTestRequestList(requests, SHOW_COMMAND);
    }

    async function showByPosition(command) {
        const position = parsePosition(command.text);

        if (position === null) {
            return `번호를 함께 입력하세요. 예: \`${SHOW_COMMAND} 1\``;
        }

        const request = await testRequestService.fetchByPosition(position);

        if (!request) {
            return `${position}번 요청이 없습니다. \`${COMMAND_NAME} list\` 로 번호를 확인하세요.`;
        }

        return renderTestRequest(request);
    }

    const handlers = {
        help: () => HELP_MESSAGE,
        latest: showLatest,
        list: () => showList(),
        show: showByPosition,
        refresh: () => showList({ refresh: true }),
    };

    return {
        name: COMMAND_NAME,
        listener: createSubcommandListener({ handlers, onUnknown: () => HELP_MESSAGE }),
    };
}

module.exports = { createQaCommand, COMMAND_NAME, parsePosition };
