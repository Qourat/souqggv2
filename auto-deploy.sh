#!/bin/bash
# Auto-deploy: checks for new commits on master every 60 seconds
LOGFILE=/var/www/souq_v2/deploy.log
cd /var/www/souq_v2

echo "[$(date)] Auto-deploy daemon started" >> $LOGFILE

while true; do
    # Fetch latest from origin
    git fetch origin master 2>/dev/null
    
    # Check if remote has new commits
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/master)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "[$(date)] New commits detected! Local: $LOCAL, Remote: $REMOTE" >> $LOGFILE
        /var/www/souq_v2/deploy.sh
    fi
    
    sleep 60
done