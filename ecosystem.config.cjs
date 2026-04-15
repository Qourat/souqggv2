module.exports = {
  apps: [
    {
      name: 'souq-v2',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/souq_v2',
    },
    {
      name: 'webhook-listener',
      script: '/var/www/souq_v2/webhook-listener.js',
      env: {
        WEBHOOK_SECRET: 'fc4577e5a1884db48687bc73978066bdf87c01fa7c99597d16bda362e527a753',
        PATH: '/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/v20.x/bin',
      },
    },
  ],
};
