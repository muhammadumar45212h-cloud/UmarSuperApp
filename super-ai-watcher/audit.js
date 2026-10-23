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
