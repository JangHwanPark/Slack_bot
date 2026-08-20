const { createSubcommandListener } = require('../lib/subcommand');

const COMMAND_NAME = '/server';
const SERVER_NAMES = ['beta', 'beta2', 'hotfix'];

const USAGE = `사용법: \`${COMMAND_NAME} ${SERVER_NAMES.join('|')}\``;

const handlers = Object.fromEntries(
    SERVER_NAMES.map((serverName) => [serverName, () => `${serverName} server is running`]),
);

function describeUnknown(subcommand) {
    if (!subcommand) {
        return USAGE;
    }

    return `알 수 없는 서버입니다: \`${subcommand}\`\n${USAGE}`;
}

module.exports = {
    name: COMMAND_NAME,
    serverNames: SERVER_NAMES,
    listener: createSubcommandListener({ handlers, onUnknown: describeUnknown }),
};
