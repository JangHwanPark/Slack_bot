const { createGmailClient } = require('./gmail-client');
const { toMailMessage } = require('./gmail-message');

/**
 * Gmail에서 메일을 읽어오는 소스.
 * fetchMessages는 최신순으로 정렬된 메일 배열을 돌려준다.
 */
function createGmailSource({ google, query, maxResults }) {
    const gmail = createGmailClient(google);

    async function fetchMessage(id) {
        const response = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        return toMailMessage(response.data);
    }

    async function fetchMessages() {
        const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
        const summaries = list.data.messages || [];

        return Promise.all(summaries.map((summary) => fetchMessage(summary.id)));
    }

    return { name: 'gmail', fetchMessages };
}

module.exports = { createGmailSource };
