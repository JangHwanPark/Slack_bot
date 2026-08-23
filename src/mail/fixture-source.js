const fs = require('fs');
const path = require('path');

const HEADER_SEPARATOR = /\r?\n\r?\n/;

function parseHeaders(headerBlock) {
    const headers = {};

    for (const line of headerBlock.split(/\r?\n/)) {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex > 0) {
            const name = line.slice(0, separatorIndex).trim().toLowerCase();
            headers[name] = line.slice(separatorIndex + 1).trim();
        }
    }

    return headers;
}

/**
 * 'Subject: ...' 헤더 블록 + 빈 줄 + 본문 형태의 텍스트 파일을 메일 모델로 바꾼다.
 * Gmail 소스와 같은 모양을 돌려주므로 파이프라인은 차이를 모른다.
 */
function parseFixture(filePath, content) {
    const separatorMatch = content.match(HEADER_SEPARATOR);
    const splitIndex = separatorMatch ? separatorMatch.index : -1;

    const headerBlock = splitIndex >= 0 ? content.slice(0, splitIndex) : '';
    const body = splitIndex >= 0 ? content.slice(splitIndex + separatorMatch[0].length) : content;
    const headers = parseHeaders(headerBlock);

    const id = path.basename(filePath, path.extname(filePath));

    return {
        id,
        threadId: id,
        subject: headers.subject || id,
        from: headers.from || 'fixture@localhost',
        receivedAt: headers.date ? new Date(headers.date) : new Date(),
        body,
        permalink: `file://${path.resolve(filePath)}`,
    };
}

/**
 * 로컬 텍스트 파일을 메일처럼 읽는 소스.
 * Gmail 자격 증명 없이 추출 규칙과 슬랙 출력을 검증할 때 쓴다.
 */
function createFixtureSource({ fixtureDir }) {
    async function fetchMessages() {
        const directory = path.resolve(fixtureDir);

        if (!fs.existsSync(directory)) {
            return [];
        }

        return fs
            .readdirSync(directory)
            .filter((fileName) => fileName.endsWith('.txt') || fileName.endsWith('.eml'))
            .map((fileName) => {
                const filePath = path.join(directory, fileName);
                return parseFixture(filePath, fs.readFileSync(filePath, 'utf8'));
            });
    }

    return { name: 'fixture', fetchMessages };
}

module.exports = { createFixtureSource, parseFixture };
