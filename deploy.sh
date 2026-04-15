#!/bin/bash
set -e

LOGFILE=/var/www/souq_v2/deploy.log
echo "[$(date)] Deploy started" >> $LOGFILE

cd /var/www/souq_v2

# Pull latest from GitHub
echo "[$(date)] Pulling latest..." >> $LOGFILE
git pull origin master 2>&1 >> $LOGFILE

# Install dependencies if needed
if git diff --name-only HEAD@{1} HEAD | grep -q "package.json\|package-lock.json"; then
    echo "[$(date)] Installing dependencies..." >> $LOGFILE
    npm ci 2>&1 >> $LOGFILE
fi

# Build
echo "[$(date)] Building..." >> $LOGFILE
npm run build 2>&1 >> $LOGFILE

# Restart PM2
echo "[$(date)] Restarting PM2..." >> $LOGFILE
pm2 restart souq-v2 2>&1 >> $LOGFILE

echo "[$(date)] Deploy complete!" >> $LOGFILE
