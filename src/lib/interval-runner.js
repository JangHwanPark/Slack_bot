const logger = require('./logger');

/**
 * 주기적으로 task를 실행한다.
 * 이전 실행이 끝나지 않았으면 이번 주기는 건너뛰어 중복 실행을 막고,
 * task가 던진 예외는 삼켜서 루프가 죽지 않게 한다.
 *
 * @returns {function(): void} 실행을 멈추는 함수
 */
function startIntervalRunner({ name, intervalMs, task }) {
    let isRunning = false;

    async function tick() {
        if (isRunning) {
            logger.warn(`${name}: 이전 실행이 아직 끝나지 않아 이번 주기를 건너뜁니다`);
            return;
        }

        isRunning = true;
        try {
            await task();
        } catch (error) {
            logger.error(`${name}: 실행 중 오류가 발생했습니다`, error);
        } finally {
            isRunning = false;
        }
    }

    const timer = setInterval(tick, intervalMs);
    tick();

    logger.info(`${name}: ${intervalMs / 1000}초 주기로 실행합니다`);

    return () => clearInterval(timer);
}

module.exports = { startIntervalRunner };
