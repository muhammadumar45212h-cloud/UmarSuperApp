#!/data/data/com.termux/files/usr/bin/bash

set -u
ROOT="$HOME/SuperSphere-New"
cd "$ROOT" || exit 1

mkdir -p logs backups
LOG="$ROOT/logs/super-app-repair-watcher.log"
REPORT="$ROOT/logs/super-app-repair-final-report.txt"
LOCK="$ROOT/logs/super-app-repair-watcher.lock"
START="$(date +%s)"
END=$((START + 3600))

# Prevent duplicate watcher instances.
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "Watcher already running. Log: $LOG"
  exit 1
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

log() {
  printf '[%s] %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"
}

notify() {
  if command -v termux-notification >/dev/null 2>&1; then
    termux-notification \
      --title "Super App Repair Watcher" \
      --content "$1" \
      --priority high 2>/dev/null || true
  else
    log "Termux notification command unavailable: $1"
  fi
}

# Back up files before making any edits.
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "backups/super-app-watcher-$STAMP"
cp -p capacitor.config.json pay.js real-ads.js ads-real.js www/index.html \
  "backups/super-app-watcher-$STAMP/" 2>/dev/null || true

log "Watcher started; 60-minute monitoring window."
log "Project: $ROOT"
notify "Watcher started. Safe checks and limited fixes running for 1 hour."

# Fix only the confirmed package-name mismatch in pay.js.
if [ -f pay.js ] && grep -q "com.supersphere.app" pay.js; then
  sed -i 's/com\.supersphere\.app/com.umar.superapp/g' pay.js
  log "Fixed pay.js package name to com.umar.superapp."
fi

# Do NOT enable free purchases, fabricate payment verification,
# or claim billing works without a real billing plugin/backend.
if [ -f pay.js ]; then
  if grep -q "TEST MODE: Add" pay.js; then
    log "BLOCKER: pay.js contains free-diamond test fallback; not enabling real purchases."
  fi
fi

# Remove no files and do not push changes to GitHub automatically.
# Monitor for one hour, rerunning syntax/integration checks every 5 minutes.
while [ "$(date +%s)" -lt "$END" ]; do
  {
    echo
    echo "===== CHECK $(date '+%F %T') ====="

    echo "--- Package ---"
    grep -nE '"appId"|applicationId|namespace' \
      capacitor.config.json android/app/build.gradle \
      android/app/build.gradle.kts 2>/dev/null || true

    echo "--- Payment integration ---"
    grep -nE 'pay\.js|payments\.js|InAppPurchases|verifyPlayStorePurchase|firebase-functions' \
      www/index.html pay.js payments.js 2>/dev/null || true

    echo "--- AdMob integration ---"
    npm ls @capacitor-community/admob @capacitor/core @capacitor/android \
      --depth=0 2>&1 || true

    echo "--- JavaScript syntax ---"
    find www api -type f -name '*.js' -not -path '*/node_modules/*' \
      -print0 2>/dev/null |
    while IFS= read -r -d '' file; do
      if command -v node >/dev/null 2>&1; then
        node --check "$file" >/dev/null 2>&1 ||
          echo "SYNTAX ERROR: $file"
      fi
    done

    echo "--- Build script ---"
    if node -e 'process.exit(require("./package.json").scripts?.build ? 0 : 1)' \
      >/dev/null 2>&1; then
      npm run build
    else
      echo "No npm build script configured; Android build not assumed."
    fi

    echo "--- Git status ---"
    git status --short 2>/dev/null || true
  } >> "$LOG" 2>&1

  sleep 300
done

{
  echo "SUPER APP REPAIR WATCHER FINAL REPORT"
  echo "Finished: $(date)"
  echo "Project: $ROOT"
  echo
  echo "Package ID:"
  grep -nE '"appId"|applicationId|namespace' \
    capacitor.config.json android/app/build.gradle \
    android/app/build.gradle.kts 2>/dev/null || true
  echo
  echo "Payment scripts and verification:"
  grep -nE 'pay\.js|payments\.js|InAppPurchases|verifyPlayStorePurchase|firebase-functions' \
    www/index.html pay.js payments.js 2>/dev/null || true
  echo
  echo "Installed billing/AdMob plugins:"
  npm ls @capacitor-community/admob @capacitor-community/in-app-purchases \
    cordova-plugin-purchase @capacitor/core --depth=0 2>&1 || true
  echo
  echo "Git status:"
  git status --short 2>/dev/null || true
  echo
  echo "Full log: $LOG"
  echo "No automatic Git push or live-payment activation was performed."
} > "$REPORT"

log "One-hour monitoring finished. Report: $REPORT"
notify "One-hour check finished. Open logs/super-app-repair-final-report.txt"
