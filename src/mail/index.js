const { createGmailSource } = require('./gmail-source');
const { createFixtureSource } = require('./fixture-source');

const SOURCE_FACTORIES = {
    gmail: createGmailSource,
    fixture: createFixtureSource,
};

/**
 * 설정에 따라 메일 소스를 만든다.
 * 모든 소스는 fetchMessages(): Promise<MailMessage[]> 하나만 노출한다.
 */
function createMailSource(mailConfig) {
    const factory = SOURCE_FACTORIES[mailConfig.source];

    if (!factory) {
        throw new Error(`지원하지 않는 메일 소스입니다: ${mailConfig.source}`);
    }

    return factory(mailConfig);
}

module.exports = { createMailSource };
