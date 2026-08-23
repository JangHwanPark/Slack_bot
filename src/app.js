const { App } = require('@slack/bolt');

const { createCommands } = require('./commands');
const { createMailSource } = require('./mail');
const { createJiraClient } = require('./jira');
const { createTestRequestPipeline } = require('./pipeline/test-request');
const { createTestRequestService } = require('./service/test-request-service');
const { createTestRequestPoller } = require('./poller/test-request-poller');
const { createSeenStore } = require('./store/seen-store');

/**
 * 의존성을 조립해 봇을 만든다.
 * 각 모듈은 인터페이스만 알고 구현체를 모른다. 구현체 선택은 전부 여기서만 일어난다.
 *
 * 커맨드는 항상 등록하고, 채널 자동 게시는 설정으로 켤 때만 만든다.
 *
 * @returns {{app: App, pollOnce: (function(): Promise<number>)|null}}
 */
function createApp(config) {
    const app = new App({
        token: config.slack.botToken,
        appToken: config.slack.appToken,
        socketMode: true,
    });

    const testRequestService = createTestRequestService({
        mailSource: createMailSource(config.mail),
        pipeline: createTestRequestPipeline({ jiraClient: createJiraClient(config.jira) }),
    });

    createCommands({
        servers: config.servers.list,
        timeoutMs: config.servers.timeoutMs,
        testRequestService,
    }).forEach(({ name, listener }) => app.command(name, listener));

    const pollOnce = config.poller.enabled
        ? createTestRequestPoller({
              testRequestService,
              seenStore: createSeenStore(config.store),
              slackClient: app.client,
              notifyChannel: config.slack.notifyChannel,
          })
        : null;

    return { app, pollOnce };
}

module.exports = { createApp };
