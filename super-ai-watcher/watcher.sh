#!/data/data/com.termux/files/usr/bin/bash
set -u

ROOT="$HOME/SuperSphere-New"
WATCH="$ROOT/super-ai-watcher"
LOG="$WATCH/logs/watcher.log"

mkdir -p "$WATCH/logs"

echo "Super AI Level 3 watcher started: $(date)" >> "$LOG"

while true; do
  echo "===== Audit started: $(date) =====" >> "$LOG"

  if node "$WATCH/audit.js" >> "$LOG" 2>&1; then
    echo "AUDIT PASS: $(date)" >> "$LOG"
  else
    echo "AUDIT FOUND ERRORS: $(date)" >> "$LOG"
  fi

  echo "Next audit in 30 minutes." >> "$LOG"
  sleep 1800
done
