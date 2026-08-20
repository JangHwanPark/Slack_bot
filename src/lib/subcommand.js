/**
 * 슬래시 커맨드 입력에서 첫 번째 단어(서브커맨드)만 뽑아낸다.
 * 예: '/server beta' -> 'beta'
 */
function parseSubcommand(text) {
    return (text || '').trim().split(/\s+/)[0].toLowerCase();
}

/**
 * 서브커맨드 이름으로 응답 메시지를 만드는 핸들러 맵을 Bolt 커맨드 리스너로 감싼다.
 *
 * @param {Object.<string, function(): string>} handlers 서브커맨드별 응답 생성 함수
 * @param {function(string): string} onUnknown 등록되지 않은 서브커맨드일 때의 응답 생성 함수
 */
function createSubcommandListener({ handlers, onUnknown }) {
    return async ({ command, ack, respond }) => {
        await ack();

        const subcommand = parseSubcommand(command.text);
        const handler = handlers[subcommand];

        await respond(handler ? handler() : onUnknown(subcommand));
    };
}

module.exports = { parseSubcommand, createSubcommandListener };
