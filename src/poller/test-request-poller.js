const logger = require('../lib/logger');
const { renderTestRequest } = require('../slack/test-request-message');

/**
 * 새 테스트 요청을 슬랙 채널에 게시한다.
 *
 * 커맨드로 직접 조회하는 것과 같은 서비스를 쓰고, 이미 알린 메일만 걸러낸다.
 * 한 통이 실패해도 나머지는 계속 처리한다.
 * 실패한 메일도 처리 기록에 남긴다. 남기지 않으면 같은 메일에서 매 주기마다
 * 같은 오류가 반복되어 로그와 채널이 오염되기 때문이다.
 *
 * @returns {function(): Promise<number>} 이번 실행에서 게시한 건수를 돌려주는 함수
 */
function createTestRequestPoller({ testRequestService, seenStore, slackClient, notifyChannel }) {
    async function publish(request) {
        await slackClient.chat.postMessage({
            channel: notifyChannel,
            ...renderTestRequest(request),
        });

        logger.info(`테스트 요청을 게시했습니다: ${request.mail.subject}`);
    }

    return async function pollOnce() {
        const requests = await testRequestService.fetchAll({ refresh: true });
        const targets = requests.filter((request) => !seenStore.has(request.mail.id)).reverse();

        if (targets.length === 0) {
            return 0;
        }

        logger.info(`새 테스트 요청 ${targets.length}건을 처리합니다`);

        let publishedCount = 0;

        for (const request of targets) {
            try {
                await publish(request);
                publishedCount += 1;
            } catch (error) {
                logger.error(`테스트 요청 게시에 실패했습니다: ${request.mail.subject}`, error);
            } finally {
                seenStore.add(request.mail.id);
            }
        }

        return publishedCount;
    };
}

module.exports = { createTestRequestPoller };
