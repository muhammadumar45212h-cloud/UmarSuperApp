#!/data/data/com.termux/files/usr/bin/bash
set -u

ROOT="$HOME/SuperSphere-New"
cd "$ROOT" || exit 1

mkdir -p logs backups
REPORT="logs/real-app-audit-$(date +%Y%m%d-%H%M%S).txt"

exec > >(tee "$REPORT") 2>&1

echo "=== SUPER APP REAL-FEATURE WATCHER ==="
date
echo "Project: $ROOT"

echo
echo "=== 1. GIT STATUS ==="
git status --short
echo "Remote:"
git remote -v | sed -E 's#(https?://)[^/@]+:[^/@]+@#\1[REDACTED]@#g'

echo
echo "=== 2. REQUIRED FILES ==="
for f in www/index.html www/sw.js www/ai-chatbot.js \
         api/super-ai.js www/super-agent/17-backend-client.js \
         real-ads.js ads-real.js pay.js payments.js; do
  if [ -f "$f" ]; then
    echo "FOUND  $f"
  else
    echo "MISSING $f"
  fi
done

echo
echo "=== 3. JAVASCRIPT SYNTAX CHECKS ==="
if command -v node >/dev/null 2>&1; then
  node --check www/sw.js || echo "FAIL: service worker syntax"
  node --check www/ai-chatbot.js || echo "FAIL: chatbot syntax"
  node --check www/super-agent/17-backend-client.js || echo "FAIL: backend client syntax"
else
  echo "Node.js not installed; syntax checks skipped."
fi

echo
echo "=== 4. INTEGRATION MARKERS ==="
grep -RniE 'firebase.initializeApp|firestore\\(\\)|/api/super-ai|GROQ_API_KEY|AdMob|admob|payment|checkout|serviceWorker.register' \
  www/index.html www/ai-chatbot.js www/super-agent api \
  real-ads.js ads-real.js pay.js payments.js 2>/dev/null \
  | head -n 100 || true

echo
echo "=== 5. SECRET SAFETY ==="
echo "No environment values or API keys are printed by this report."
echo "Do not commit .env files, tokens, private keys, or service-account JSON."

echo
echo "=== 6. DEPLOYMENT CHECK ==="
if [ -f vercel.json ]; then
  echo "Found vercel.json"
else
  echo "No vercel.json at project root; inspect Vercel project settings."
fi

echo
echo "=== AUDIT FINISHED ==="
echo "Report: $REPORT"
echo "This watcher audits only; it does not claim untested features are real."
