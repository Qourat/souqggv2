#!/bin/bash
set -e

LOGFILE=/var/www/souq_v2/deploy.log
BRANCH="master"
cd /var/www/souq_v2

echo "[$(date)] ===== Deploy started =====" >> $LOGFILE

# Stash any local changes just in case
git stash --quiet 2>/dev/null || true

# Pull latest from GitHub
echo "[$(date)] Pulling latest from origin/$BRANCH..." >> $LOGFILE
git pull origin $BRANCH 2>&1 >> $LOGFILE

# Check if package.json or package-lock.json changed
CHANGED=$(git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -E "package" || true)
if [ -n "$CHANGED" ]; then
    echo "[$(date)] Dependencies changed, running npm ci..." >> $LOGFILE
    npm ci 2>&1 >> $LOGFILE
fi

# Build
echo "[$(date)] Building Next.js..." >> $LOGFILE
npm run build 2>&1 >> $LOGFILE

# Restart PM2
echo "[$(date)] Restarting souq-v2..." >> $LOGFILE
pm2 restart souq-v2 2>&1 >> $LOGFILE

echo "[$(date)] ===== Deploy complete =====" >> $LOGFILE
