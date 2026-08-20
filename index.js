const { loadConfig } = require('./src/config');
const { createApp } = require('./src/app');

async function main() {
    const app = createApp(loadConfig());

    await app.start();
    console.log('bot running');
}

main().catch((error) => {
    console.error(`봇 시작 실패: ${error.message}`);
    process.exit(1);
});
