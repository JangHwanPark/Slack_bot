/**
 * Gmail refresh token 발급 스크립트.
 *
 * 사용법:
 *   1. .env 에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 를 채운다
 *   2. node scripts/google-auth.js
 *   3. 출력된 주소를 브라우저에서 열고 구글 계정으로 동의한다
 *   4. 콘솔에 찍힌 GOOGLE_REFRESH_TOKEN 값을 .env 에 붙여 넣는다
 *
 * 구글 클라우드 콘솔의 OAuth 클라이언트에 아래 리디렉션 URI가 등록되어 있어야 한다.
 *   http://localhost:5555/oauth2callback
 */
require('dotenv').config();

const http = require('http');
const { google } = require('googleapis');

const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function requireEnv(key) {
    if (!process.env[key]) {
        throw new Error(`${key} 가 .env 에 없습니다`);
    }
    return process.env[key];
}

function respondAndClose(response, message) {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(message);
}

function main() {
    const oauthClient = new google.auth.OAuth2(
        requireEnv('GOOGLE_CLIENT_ID'),
        requireEnv('GOOGLE_CLIENT_SECRET'),
        REDIRECT_URI,
    );

    const server = http.createServer(async (request, response) => {
        const url = new URL(request.url, REDIRECT_URI);

        if (url.pathname !== '/oauth2callback') {
            response.writeHead(404).end();
            return;
        }

        const code = url.searchParams.get('code');

        if (!code) {
            respondAndClose(response, '인증 코드를 받지 못했습니다. 콘솔을 확인하세요.');
            server.close();
            return;
        }

        try {
            const { tokens } = await oauthClient.getToken(code);
            respondAndClose(response, '발급이 끝났습니다. 터미널로 돌아가세요.');

            if (!tokens.refresh_token) {
                console.error('refresh token이 없습니다. 구글 계정 보안 설정에서 이 앱의 권한을 해제한 뒤 다시 실행하세요.');
            } else {
                console.log('\n.env 에 아래 줄을 추가하세요\n');
                console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
            }
        } catch (error) {
            respondAndClose(response, '토큰 발급에 실패했습니다. 콘솔을 확인하세요.');
            console.error(error);
        } finally {
            server.close();
        }
    });

    server.listen(PORT, () => {
        const authUrl = oauthClient.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES,
        });

        console.log('아래 주소를 브라우저에서 열어 동의하세요\n');
        console.log(`${authUrl}\n`);
    });
}

main();
