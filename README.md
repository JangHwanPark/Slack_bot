# Slack QA Bot

테스트 요청 메일을 읽어 빌드 정보와 연결된 지라 이슈를 슬랙 채널에 정리해 알리는 봇.

## 동작

1. Gmail을 검색해 테스트 요청 메일을 찾는다
2. 본문에서 빌드 정보(버전, 빌드 번호, 플랫폼, 다운로드 링크 등)를 추출한다
3. 본문에서 지라 링크와 이슈 키를 찾아 지라 API로 제목, 상태, 담당자를 조회한다
4. 하나의 카드로 묶어 슬랙에 보여준다

지라 조회에 실패해도 결과는 나온다. 이 경우 본문에서 찾은 링크만 표시된다.

기본은 커맨드를 칠 때만 조회하는 방식이다. 채널 자동 게시는 `POLL_ENABLED=true`로 켤 수 있다.

## 슬래시 커맨드

| 커맨드 | 설명 |
| --- | --- |
| `/server` \| `/server all` | 전체 서버 상태 확인 |
| `/server beta` \| `beta2` \| `hotfix` | 해당 서버 상태 확인 |
| `/qa latest` | 가장 최근 테스트 요청 상세 |
| `/qa list` | 최근 테스트 요청 목록 |
| `/qa show <번호>` | 목록에서 고른 요청 상세 |
| `/qa refresh` | 메일을 다시 읽고 목록 보기 |
| `/qa help` | 도움말 |

`/server`는 `.env`의 `SERVER_<이름>_URL` 로 실제 HTTP 요청을 보내
상태 코드, 응답 시간, 응답 본문의 버전과 커밋을 보여준다.
헬스 엔드포인트가 JSON을 돌려주면 `version`, `build`, `commit`, `env`, `status` 필드를 자동으로 읽는다.
필드 이름이 다르면 `src/servers/health-checker.js`의 `DETAIL_FIELDS`에 후보를 추가한다.

응답은 명령을 친 본인에게만 보인다. 메일 조회 결과는 30초간 재사용하므로
`/qa list` 직후 `/qa show 2`를 쳐도 번호가 어긋나지 않는다. 최신 상태가 필요하면 `/qa refresh`를 쓴다.

Slack 앱 설정(api.slack.com > Slash Commands)에 `/server`, `/qa` 두 개를 등록하고 워크스페이스에 재설치해야 한다. Socket Mode를 쓰므로 Request URL은 필요 없다.

## 로컬에서 먼저 확인하기

Gmail이나 지라 자격 증명 없이 추출 규칙과 슬랙 카드 모양을 검증할 수 있다.

```bash
npm install
cp .env.example .env          # MAIL_SOURCE=fixture, JIRA_TYPE=none 그대로 두고 슬랙 토큰만 채운다
node scripts/extract-preview.js fixtures/mails/sample-test-request.txt
```

`extract-preview`는 메일 텍스트 파일 하나를 넣으면 어떤 값이 추출되는지 출력한다. 회사 메일을 텍스트로 저장해 이 스크립트에 넣어보면서 규칙을 다듬는 것이 가장 빠르다.

## 회사 적용 절차

1. **메일 샘플 확보**: 실제 테스트 요청 메일을 `fixtures/mails/*.txt`로 저장한다. 첫 줄에 `Subject:`, `From:`, 빈 줄, 그 뒤 본문 형식이다
2. **추출 규칙 조정**: `src/extract/rules.js`의 라벨 목록을 회사 메일 양식에 맞게 고친다. 다른 파일은 건드릴 필요가 없다
3. **규칙 검증**: `node scripts/extract-preview.js`로 원하는 값이 다 잡히는지 확인한다
4. **Gmail 연결**: 구글 클라우드에서 OAuth 클라이언트를 만들고 `node scripts/google-auth.js`로 refresh token을 발급받아 `.env`에 넣는다. `MAIL_SOURCE=gmail`로 바꾼다
5. **지라 연결**: `JIRA_TYPE`을 `cloud` 또는 `server`로 바꾸고 URL과 토큰을 넣는다
6. **쿼리 조정**: `MAIL_QUERY`를 실제 메일을 정확히 걸러내는 Gmail 검색식으로 맞춘다

## 구조

```
index.js                          진입점. 설정 로드, 앱 시작, 폴링 등록
src/config.js                     환경변수 로드와 검증
src/app.js                        의존성 조립. 구현체 선택은 전부 여기서만 일어난다
src/service/test-request-service.js  조회 진입점. 커맨드와 폴링이 함께 쓴다
src/extract/rules.js              추출 규칙. 회사 적용 시 수정하는 유일한 파일
src/extract/field-extractor.js    규칙을 적용하는 범용 로직
src/extract/build-info.js         빌드 정보 추출
src/extract/jira-refs.js          지라 이슈 키와 링크 추출
src/mail/gmail-source.js          Gmail 소스
src/mail/fixture-source.js        로컬 파일 소스 (자격 증명 없이 테스트)
src/jira/rest-client.js           Jira REST 호출. Cloud와 Server 공용
src/pipeline/test-request.js      메일과 지라를 합쳐 테스트 요청 객체로 조립
src/slack/test-request-message.js Block Kit 카드 생성
src/poller/test-request-poller.js 폴링 작업
src/store/seen-store.js           이미 알린 메일 기록
```

메일 소스와 지라 클라이언트는 인터페이스로 분리되어 있다. 사내 메일이 Gmail이 아니거나 이슈 트래커가 바뀌어도 해당 어댑터만 추가하면 나머지는 그대로 쓸 수 있다.

## 서버 배포

Socket Mode라 인바운드 포트, 도메인, 인증서가 필요 없다. 아웃바운드 HTTPS만 열려 있으면 사내망 안에서도 동작한다.

```bash
npm ci
pm2 start index.js --name slack-qa-bot
pm2 save
```

지라나 빌드 서버가 사내망에만 있다면 봇도 사내망 안에 두어야 한다.
