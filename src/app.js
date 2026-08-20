const { App } = require('@slack/bolt');
const commands = require('./commands');

function createApp({ botToken, appToken }) {
    const app = new App({
        token: botToken,
        appToken,
        socketMode: true,
    });

    commands.forEach(({ name, listener }) => app.command(name, listener));

    return app;
}

module.exports = { createApp };
