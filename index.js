const { loadConfig } = require('./src/config');
const { createApp } = require('./src/app');
const { startIntervalRunner } = require('./src/lib/interval-runner');
const logger = require('./src/lib/logger');

async function main() {
    const config = loadConfig();
    const { app, pollOnce } = createApp(config);

    await app.start();
    logger.info(`봇을 시작했습니다 (메일 소스: ${config.mail.source}, 지라: ${config.jira.type})`);

    if (pollOnce) {
        startIntervalRunner({
            name: '테스트 요청 메일 확인',
            intervalMs: config.poller.intervalMs,
            task: pollOnce,
        });
    } else {
        logger.info('채널 자동 게시는 꺼져 있습니다. 슬랙에서 /qa latest 또는 /qa list 로 확인하세요');
    }
}

main().catch((error) => {
    logger.error('봇을 시작하지 못했습니다', error);
    process.exit(1);
});
