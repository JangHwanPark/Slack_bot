const CACHE_TTL_MS = 30 * 1000;

/**
 * 테스트 요청을 조회하는 진입점.
 *
 * 슬래시 커맨드와 폴링이 모두 이 서비스를 쓴다.
 * `/qa list` 직후 `/qa show 2` 처럼 연달아 호출되는 경우가 많아
 * 짧은 시간 동안은 같은 결과를 재사용한다. 목록 번호와 상세가 어긋나는 것도 이걸로 막는다.
 */
function createTestRequestService({ mailSource, pipeline }) {
    let cache = { fetchedAt: 0, requests: null };

    function isCacheValid() {
        return cache.requests !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
    }

    async function load() {
        const mails = await mailSource.fetchMessages();
        const targets = pipeline.filterTestRequests(mails);
        const requests = await Promise.all(targets.map((mail) => pipeline.process(mail)));

        return requests.sort((a, b) => b.mail.receivedAt - a.mail.receivedAt);
    }

    /** @param {{refresh?: boolean}} options refresh가 true면 캐시를 무시하고 다시 읽는다 */
    async function fetchAll({ refresh = false } = {}) {
        if (!refresh && isCacheValid()) {
            return cache.requests;
        }

        const requests = await load();
        cache = { fetchedAt: Date.now(), requests };

        return requests;
    }

    async function fetchLatest(options) {
        const [latest] = await fetchAll(options);
        return latest || null;
    }

    /** 1부터 시작하는 번호로 한 건을 집는다. 목록에 보여준 번호와 같다. */
    async function fetchByPosition(position, options) {
        const requests = await fetchAll(options);
        return requests[position - 1] || null;
    }

    return { fetchAll, fetchLatest, fetchByPosition };
}

module.exports = { createTestRequestService };
