const { google } = require('googleapis');

/** refresh token으로 access token을 자동 갱신하는 Gmail 클라이언트를 만든다. */
function createGmailClient({ clientId, clientSecret, refreshToken }) {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    return google.gmail({ version: 'v1', auth });
}

module.exports = { createGmailClient };
