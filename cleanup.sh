#!/bin/bash
# SuperSphere Cleanup Script
# Ye purani JS files ko backup mein le jayegi

mkdir -p old_js_backup

# Ye files RAKHNI HAIN (mat chhero)
KEEP="index.html index.js pay.js blue-tick.js video-upload-free.js permissions-fix.js config.js"

# Baaki saari .js files backup mein le jao
for file in *.js; do
    if [[ ! " $KEEP " =~ " $file " ]]; then
        mv "$file" old_js_backup/ 2>/dev/null
        echo "Moved: $file"
    fi
done

echo "✅ Cleanup complete!"
echo "Kept files:"
ls *.js
echo ""
echo "Backed up files:"
ls old_js_backup/ | wc -l
