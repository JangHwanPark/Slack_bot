const { createSubcommandListener } = require('../lib/subcommand');
const serverCommand = require('./server');

const COMMAND_NAME = '/qa';

const HELP_MESSAGE = [
    '*사용 가능한 명령어*',
    ...serverCommand.serverNames.map(
        (serverName) => `\`${serverCommand.name} ${serverName}\` : ${serverName} 서버 상태 확인`,
    ),
    `\`${COMMAND_NAME} help\` : 이 도움말 보기`,
].join('\n');

function buildHelp() {
    return HELP_MESSAGE;
}

module.exports = {
    name: COMMAND_NAME,
    listener: createSubcommandListener({
        handlers: { help: buildHelp },
        onUnknown: buildHelp,
    }),
};
