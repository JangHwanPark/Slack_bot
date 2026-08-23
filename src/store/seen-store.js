const fs = require('fs');
const path = require('path');

const logger = require('../lib/logger');

/**
 * 이미 알린 메일 id를 파일에 남긴다.
 * 봇을 재시작해도 같은 메일을 다시 알리지 않기 위한 최소한의 상태 저장이다.
 * 기록은 오래된 것부터 잘라 maxEntries 개까지만 유지한다.
 */
function createSeenStore({ filePath, maxEntries }) {
    const absolutePath = path.resolve(filePath);
    let ids = load();

    function load() {
        try {
            if (!fs.existsSync(absolutePath)) {
                return [];
            }
            const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            logger.warn(`처리 기록을 읽지 못해 빈 상태로 시작합니다: ${error.message}`);
            return [];
        }
    }

    function save() {
        try {
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, JSON.stringify(ids, null, 2));
        } catch (error) {
            logger.error('처리 기록을 저장하지 못했습니다', error);
        }
    }

    return {
        has: (id) => ids.includes(id),
        add(id) {
            if (ids.includes(id)) {
                return;
            }
            ids = [...ids, id].slice(-maxEntries);
            save();
        },
        get size() {
            return ids.length;
        },
    };
}

module.exports = { createSeenStore };
