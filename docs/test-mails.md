# 테스트용 메일 원고

봇 동작을 확인하려고 직접 보내보는 가짜 테스트 요청 메일이다.
Gmail 작성 창에 제목과 본문을 그대로 붙여 넣고 본인 주소로 보내면 된다.

제목에 `테스트 요청`이 들어가야 봇이 인식한다. `src/extract/rules.js`의
`TEST_REQUEST_SUBJECT_PATTERNS`가 판별 기준이다.

---

## 1. 빌드 정보 + 지라 링크가 모두 있는 메일

가장 일반적인 형태. 빌드 정보 8개 항목과 지라 이슈 3건이 모두 추출된다.

**제목**

```
[테스트 요청] 모바일 앱 2.14.0 beta 배포 테스트 요청드립니다
```

**본문**

```markdown
QA팀 안녕하세요.

아래 빌드 테스트 부탁드립니다.

- **버전**: 2.14.0
- **빌드 번호**: 3921
- **플랫폼**: Android
- **환경**: beta
- **브랜치**: release/2.14.0
- **커밋**: 9f2c1ab
- **다운로드**: https://build.example.com/download/app-2.14.0-3921.apk
- **빌드 링크**: https://jenkins.example.com/job/mobile-app/3921/

이번 배포에 포함된 이슈입니다.

https://example.atlassian.net/browse/QA-1421
https://example.atlassian.net/browse/QA-1435

관련해서 ANDROID-882 도 함께 확인 부탁드립니다.

감사합니다.
```

---

## 2. 지라 링크만 있는 메일

빌드 정보가 없을 때 카드가 어떻게 나오는지 확인용.
"본문에서 빌드 정보를 찾지 못했습니다"가 표시되고 이슈 목록만 나와야 한다.

**제목**

```
[테스트 요청] 결제 모듈 회귀 테스트 요청
```

**본문**

```markdown
QA팀 안녕하세요.

이번 스프린트에서 수정된 결제 관련 이슈 회귀 테스트 부탁드립니다.
빌드는 기존 beta 서버에 이미 올라가 있습니다.

https://example.atlassian.net/browse/PAY-233
https://example.atlassian.net/browse/PAY-241

PAY-250 은 아직 개발 중이라 이번 범위에서 제외입니다.

감사합니다.
```

---

## 3. 라벨 형식이 다른 메일

회사 양식이 위와 다를 때를 가정한 것. 지금 규칙으로는 8개 중 4개만 잡힌다.

- 잡히는 것: 버전, 플랫폼, 환경, 다운로드
- 못 잡는 것: 빌드 번호, 브랜치, 커밋, 빌드 페이지
- 버전 값이 `3.0.1 (빌드 512)`로 통째로 들어온다. 빌드 번호가 별도 줄이 아니라
  괄호 안에 있어서 생기는 문제이고, 이런 경우 `rules.js`에 전용 패턴을 하나 더 넣어야 한다

회사 메일이 이런 식이면 `rules.js`를 어떻게 고쳐야 하는지 감을 잡는 용도다.

**제목**

```
[테스트 요청] iOS 배포 빌드 확인 요청
```

**본문**

```markdown
안녕하세요.

앱 버전 : 3.0.1 (빌드 512)
대상 : iOS 16 이상
서버 : hotfix

설치 링크
https://testflight.apple.com/join/abc123

확인 대상 티켓: IOS-77
```

---

## 보내기 전 확인할 것

**메일 검색 조건.** 본인이 본인에게 보낸 메일은 Gmail이 읽음 처리하는 경우가 있어
기본값 `is:unread`로는 안 잡힐 수 있다. 테스트 중에는 `.env`를 다음으로 바꾼다.

```
MAIL_QUERY=subject:(테스트 요청) newer_than:1d
```

**지라 링크.** `JIRA_TYPE=none`이면 링크만 표시되고 조회는 하지 않으므로
위 예시의 `example.atlassian.net` 주소를 그대로 써도 된다.
실제 조회까지 확인하려면 회사 지라의 실제 이슈 키와 주소로 바꿔야 한다.

**보낸 뒤.** 슬랙에서 `/qa list`로 잡히는지 보고 `/qa show <번호>`로 상세를 확인한다.
메일을 방금 보냈는데 목록에 없으면 `/qa refresh`로 다시 읽는다.

## 보내지 않고 먼저 확인하기

위 세 메일이 `fixtures/mails/`에 텍스트 파일로 들어 있다.
Gmail 연결 전에 추출 결과만 보려면 아래를 실행한다.

```bash
node scripts/extract-preview.js fixtures/mails/sample-test-request.txt
node scripts/extract-preview.js fixtures/mails/sample-jira-only.txt
node scripts/extract-preview.js fixtures/mails/sample-other-format.txt
```
