const logger = require('./logger');

/**
 * 슬래시 커맨드 입력에서 첫 번째 단어(서브커맨드)만 뽑아낸다.
 * 예: '/server beta' -> 'beta'
 */
function parseSubcommand(text) {
    return (text || '').trim().split(/\s+/)[0].toLowerCase();
}

/**
 * 서브커맨드별 응답 함수 맵을 Bolt 커맨드 리스너로 감싼다.
 *
 * 응답 함수는 문자열이나 Block Kit 페이로드({ text, blocks })를 돌려주면 된다.
 * 비동기여도 되고, 원본 command 객체를 인자로 받는다.
 * ack는 먼저 보내므로 응답 생성이 오래 걸려도 슬랙 3초 제한에 걸리지 않는다.
 *
 * @param {Object.<string, function(object): (string|object|Promise<string|object>)>} handlers 서브커맨드별 응답 생성 함수
 * @param {function(string): (string|object)} onUnknown 등록되지 않은 서브커맨드일 때의 응답 생성 함수
 */
function createSubcommandListener({ handlers, onUnknown }) {
    return async ({ command, ack, respond }) => {
        await ack();

        const subcommand = parseSubcommand(command.text);
        const handler = handlers[subcommand];

        try {
            await respond(handler ? await handler(command) : onUnknown(subcommand));
        } catch (error) {
            logger.error(`${command.command} ${subcommand} 처리에 실패했습니다`, error);
            await respond(`명령을 처리하지 못했습니다: ${error.message}`);
        }
    };
}

module.exports = { parseSubcommand, createSubcommandListener };
