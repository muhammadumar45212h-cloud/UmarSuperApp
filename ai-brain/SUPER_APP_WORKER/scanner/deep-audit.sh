#!/data/data/com.termux/files/usr/bin/bash
set -u

ROOT="$HOME/SuperSphere-New"
WORKER="$ROOT/ai-brain/SUPER_APP_WORKER"
REPORT="$WORKER/logs/deep-audit-report.txt"

mkdir -p "$WORKER/logs"
cd "$ROOT" || exit 1

{
  echo "SUPER APP GUARDIAN — DEEP AUDIT"
  date
  echo "Project: $ROOT"
  echo "Mode: READ ONLY"
  echo

  echo "========== 1. EXISTING AGENT MODULES =========="
  for f in www/super-agent/*.js; do
    [ -f "$f" ] || continue
    printf '\n--- %s ---\n' "$f"
    grep -nE 'window\.|globalThis|export |function |async function |fetch\(|addEventListener|TODO|FIXME' \
      "$f" 2>/dev/null | head -n 18 || true
  done

  echo
  echo "========== 2. AI BACKEND CONTRACT =========="
  if [ -f api/super-ai.js ]; then
    grep -nE 'export default|async function|req\.method|req\.body|question|history|process\.env|fetch\(|status\(|json\(' \
      api/super-ai.js | sed -E 's/(process\.env\.[A-Z0-9_]+)/ENV_VAR_REFERENCE/g' | head -n 100
  else
    echo "api/super-ai.js missing"
  fi

  echo
  echo "========== 3. UPLOAD AND MODERATION HOOKS =========="
  grep -RInE \
    'uploadBytes|putFile|uploadString|uploadBytesResumable|createObjectURL|input.*file|video.*upload|upload.*video|addDoc|collection\(.*posts|moderation|quarantine|explicit|adultContent|nsfw|reportPost|deleteDoc|removePost' \
    www api --include='*.js' --include='*.html' 2>/dev/null \
    | grep -vE 'node_modules|ai-knowledge|SUPER_APP_WORKER|\.map:' \
    | head -n 180 || true

  echo
  echo "========== 4. FIREBASE AND STORAGE REFERENCES =========="
  grep -RIlE 'firebase|firestore|storage\.ref|initializeApp|createClient' \
    www api --include='*.js' --include='*.html' 2>/dev/null \
    | grep -vE 'node_modules|ai-knowledge|SUPER_APP_WORKER' \
    | head -n 100 || true

  echo
  echo "========== 5. ADMIN AND APP BRIDGE =========="
  for f in www/super-agent/21-app-bridge.js \
           www/super-agent/19-diagnostics.js \
           www/super-agent/20-orchestrator.js \
           www/index.html; do
    [ -f "$f" ] || continue
    echo "--- $f ---"
    grep -nEi 'admin|role|permission|authorize|auth\.currentUser|onAuthStateChanged|appBridge|orchestrator|diagnostic|super-agent' \
      "$f" | head -n 60 || true
  done

  echo
  echo "========== 6. API ROUTE INVENTORY =========="
  if [ -d api ]; then
    find api -maxdepth 4 -type f \
      ! -name '*.map' \
      ! -name '.env*' \
      -print | sort | head -n 250
  else
    echo "No api directory"
  fi

  echo
  echo "========== 7. CONFIGURATION PRESENCE ONLY =========="
  for f in .env .env.local .env.production vercel.json \
           capacitor.config.json package.json; do
    if [ -f "$f" ]; then
      echo "FOUND: $f"
    else
      echo "NOT FOUND: $f"
    fi
  done
  echo "Secret values were not intentionally printed."

  echo
  echo "========== 8. GIT CHANGE SUMMARY =========="
  git status --short 2>/dev/null || true

  echo
  echo "========== AUDIT LIMITATIONS =========="
  echo "This report does not prove any feature works."
  echo "No AI API calls, content deletion, deployment or source edits were performed."
  echo "Human review is required before implementing changes."

} > "$REPORT" 2>&1

echo "Audit complete."
echo "Report saved at:"
echo "$REPORT"
echo
echo "Report size:"
wc -l -c "$REPORT"
echo
echo "First 100 lines:"
sed -n '1,100p' "$REPORT"
