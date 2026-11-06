#!/data/data/com.termux/files/usr/bin/bash
set -u

ROOT="$HOME/SuperSphere-New"
cd "$ROOT" || exit 1

echo "=== SUPER APP READ-ONLY INVENTORY ==="
date
printf 'Project: %s\n' "$PWD"

echo
echo "=== GIT STATUS ==="
git status --short 2>/dev/null || echo "Git unavailable or repository not initialized"

echo
echo "=== RELEVANT FILES ==="
for f in package.json capacitor.config.json \
  www/index.html www/sw.js api/super-ai.js \
  pay.js payments.js real-ads.js ads-real.js \
  android/app/build.gradle android/app/build.gradle.kts; do
  if [ -f "$f" ]; then
    printf 'FOUND: %s (%s bytes)\n' "$f" "$(wc -c < "$f")"
  else
    printf 'MISSING: %s\n' "$f"
  fi
done

echo
echo "=== PACKAGE SCRIPTS ==="
node -e '
const fs=require("fs");
if(!fs.existsSync("package.json")) {
  console.log("package.json missing");
  process.exit(0);
}
try {
 const p=JSON.parse(fs.readFileSync("package.json","utf8"));
 console.log(JSON.stringify({
   name:p.name,
   scripts:p.scripts,
   dependencies:Object.keys(p.dependencies||{}),
   devDependencies:Object.keys(p.devDependencies||{})
 },null,2));
} catch(e) {
 console.log("Could not parse package.json:",e.message);
}
' 2>/dev/null || true

echo
echo "=== SCRIPT REFERENCES ==="
grep -nE '<script|serviceWorker|real-ads|ads-real|pay\.js|payments\.js|super-ai' \
  www/index.html 2>/dev/null | head -n 100 || true

echo
echo "=== END ==="
echo "Read-only inventory only. No application files were changed."
