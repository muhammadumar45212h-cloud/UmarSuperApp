#!/data/data/com.termux/files/usr/bin/bash
set -u

ROOT="$HOME/SuperSphere-New"
cd "$ROOT" || exit 1

AI_DIR="$ROOT/www/ai-knowledge"
WATCH_DIR="$ROOT/super-ai-watcher"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$AI_DIR" "$WATCH_DIR" "$WATCH_DIR/logs" "$WATCH_DIR/backups"

# Backup key AI files before any future integration changes.
for f in \
  www/index.html \
  www/ai-chatbot.js \
  www/super-ai-engine.js \
  www/super-ai-knowledge-hub.js \
  www/super-ai-learning-memory.js
do
  if [ -f "$f" ]; then
    cp -p "$f" "$WATCH_DIR/backups/$(basename "$f").$STAMP.bak"
  fi
done

cat > "$WATCH_DIR/audit.js" <<'JS'
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const knowledgeDir = path.join(root, "www", "ai-knowledge");
const indexFile = path.join(root, "www", "index.html");
const logDir = path.join(__dirname, "logs");

fs.mkdirSync(logDir, { recursive: true });

const files = fs.existsSync(knowledgeDir)
  ? fs.readdirSync(knowledgeDir)
      .filter(name => name.endsWith(".js"))
      .map(name => path.join(knowledgeDir, name))
  : [];

let ok = 0;
let errors = 0;
let records = 0;
const report = [];

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const arrays = source.match(/\[[\s\S]*?\]/g) || [];
  const count = (source.match(/\bquestion\s*:/g) || []).length;
  records += count;

  try {
    new (require("vm").Script)(source, { filename: file });
    ok++;
    report.push(`OK | ${path.basename(file)} | detected Q&A fields: ${count}`);
  } catch (error) {
    errors++;
    report.push(`ERROR | ${path.basename(file)} | ${error.message}`);
  }
}

let html = "";
if (fs.existsSync(indexFile)) html = fs.readFileSync(indexFile, "utf8");

const summary = [
  `Time: ${new Date().toISOString()}`,
  `Knowledge JS files: ${files.length}`,
  `Syntax OK: ${ok}`,
  `Syntax errors: ${errors}`,
  `Question fields detected: ${records}`,
  `index.html exists: ${fs.existsSync(indexFile)}`,
  `Chatbot file exists: ${fs.existsSync(path.join(root, "www", "ai-chatbot.js"))}`,
  `Engine file exists: ${fs.existsSync(path.join(root, "www", "super-ai-engine.js"))}`,
  `Knowledge hub exists: ${fs.existsSync(path.join(root, "www", "super-ai-knowledge-hub.js"))}`,
  `Knowledge script names in index: ${(html.match(/super-ai-mega-[^"' ]+\.js/g) || []).length}`,
  "",
  ...report
].join("\n");

const out = path.join(logDir, "latest-report.txt");
fs.writeFileSync(out, summary + "\n");
console.log(summary);
console.log(`\nReport saved: ${out}`);

if (errors) process.exitCode = 1;
JS

cat > "$WATCH_DIR/watcher.sh" <<'SH'
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
SH

chmod +x "$WATCH_DIR/watcher.sh"

echo
echo "===== FIRST AUDIT ====="
node "$WATCH_DIR/audit.js" || true

echo
echo "===== SETUP COMPLETE ====="
echo "Watcher: $WATCH_DIR/watcher.sh"
echo "Report:  $WATCH_DIR/logs/latest-report.txt"
echo "Log:     $WATCH_DIR/logs/watcher.log"
echo
echo "Pehle audit complete hone dein. Ye watcher abhi AI ko naya ilm khud se nahi sikhata;"
echo "ye existing knowledge files ko audit karta hai. Agla integration audit report par based hoga."
