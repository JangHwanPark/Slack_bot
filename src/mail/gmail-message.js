const GMAIL_PERMALINK_PREFIX = 'https://mail.google.com/mail/u/0/#all';

function decodeBody(data) {
    return data ? Buffer.from(data, 'base64url').toString('utf8') : '';
}

function findHeader(headers, name) {
    const header = (headers || []).find((item) => item.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
}

/** MIME 트리를 깊이 우선으로 펼친다. */
function flattenParts(payload) {
    if (!payload) {
        return [];
    }

    const children = (payload.parts || []).flatMap(flattenParts);
    return [payload, ...children];
}

function stripHtml(html) {
    return html
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|tr|li|h[1-6])>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/** text/plain을 우선 쓰고, 없으면 text/html을 텍스트로 변환해 쓴다. */
function extractBody(payload) {
    const parts = flattenParts(payload);
    const findByMimeType = (mimeType) =>
        parts.find((part) => part.mimeType === mimeType && part.body && part.body.data);

    const plainPart = findByMimeType('text/plain');
    if (plainPart) {
        return decodeBody(plainPart.body.data);
    }

    const htmlPart = findByMimeType('text/html');
    if (htmlPart) {
        return stripHtml(decodeBody(htmlPart.body.data));
    }

    return '';
}

/**
 * Gmail API 응답을 봇 내부에서 쓰는 메일 모델로 바꾼다.
 * 이후 파이프라인은 Gmail 고유 구조를 알 필요가 없다.
 *
 * @returns {{id: string, threadId: string, subject: string, from: string,
 *            receivedAt: Date, body: string, permalink: string}}
 */
function toMailMessage(message) {
    const headers = message.payload && message.payload.headers;

    return {
        id: message.id,
        threadId: message.threadId,
        subject: findHeader(headers, 'Subject'),
        from: findHeader(headers, 'From'),
        receivedAt: new Date(Number(message.internalDate)),
        body: extractBody(message.payload),
        permalink: `${GMAIL_PERMALINK_PREFIX}/${message.id}`,
    };
}

module.exports = { toMailMessage, stripHtml };
