const { createServerCommand } = require('./server');
const { createQaCommand } = require('./qa');

/** 등록할 슬래시 커맨드 목록을 만든다. 커맨드를 추가하면 여기에 한 줄만 더한다. */
function createCommands({ servers, timeoutMs, testRequestService }) {
    return [
        createServerCommand({ servers, timeoutMs, testRequestService }),
        createQaCommand({ testRequestService }),
    ];
}

module.exports = { createCommands };
