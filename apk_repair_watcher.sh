#!/data/data/com.termux/files/usr/bin/bash

ROOT="$HOME/SuperSphere-New"
ANDROID="$ROOT/android"
TOOLS="$HOME/tools"
GRADLE_PROPS="$HOME/.gradle/gradle.properties"
LOG="$ROOT/apk_repair_watcher.log"
REPORT="$ROOT/apk_repair_report.txt"
APK="$ANDROID/app/build/outputs/apk/debug/app-debug.apk"
OUTPUT="$ROOT/Super-App-debug.apk"
MAX_ATTEMPTS=1000
DELAY=300

mkdir -p "$ROOT"
mkdir -p "$(dirname "$GRADLE_PROPS")"

if [ ! -d "$ANDROID" ]; then
  echo "ERROR: Android project not found: $ANDROID" | tee -a "$LOG"
  exit 1
fi

if [ ! -f "$ROOT/gradlew" ] && [ ! -f "$ANDROID/gradlew" ]; then
  echo "ERROR: Gradle wrapper not found" | tee -a "$LOG"
  exit 1
fi

if [ ! -f "$GRADLE_PROPS" ]; then
  touch "$GRADLE_PROPS"
fi

BACKUP="$ROOT/gradle.properties.watcher-backup"
if [ ! -f "$BACKUP" ]; then
  cp "$GRADLE_PROPS" "$BACKUP"
fi

set_override() {
  local path="$1"
  if grep -q '^android\.aapt2FromMavenOverride=' "$GRADLE_PROPS"; then
    sed -i "s#^android\.aapt2FromMavenOverride=.*#android.aapt2FromMavenOverride=$path#" "$GRADLE_PROPS"
  else
    printf '\nandroid.aapt2FromMavenOverride=%s\n' "$path" >> "$GRADLE_PROPS"
  fi
}

remove_override() {
  sed -i '/^android\.aapt2FromMavenOverride=/d' "$GRADLE_PROPS"
}

echo "===== APK REPAIR WATCHER STARTED =====" | tee -a "$LOG"
echo "Start: $(date)" | tee -a "$LOG"
echo "Maximum attempts: $MAX_ATTEMPTS" | tee -a "$LOG"
echo "Retry delay: $DELAY seconds" | tee -a "$LOG"

cd "$ANDROID" || exit 1

for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  echo | tee -a "$LOG"
  echo "========== ATTEMPT $i / $MAX_ATTEMPTS : $(date) ==========" | tee -a "$LOG"

  case $(( (i-1) % 3 )) in
    0)
      METHOD="AAPT2 named aapt2"
      if [ ! -x "$TOOLS/aapt2" ]; then
        echo "SKIP: $TOOLS/aapt2 is missing or not executable" | tee -a "$LOG"
        sleep "$DELAY"
        continue
      fi
      set_override "$TOOLS/aapt2"
      ;;
    1)
      METHOD="AOSP AAPT2"
      set_override "$TOOLS/aapt2-aosp"
      ;;
    2)
      METHOD="Gradle default AAPT2"
      remove_override
      ;;
  esac

  echo "METHOD: $METHOD" | tee -a "$LOG"

  if ./gradlew assembleDebug --no-daemon --stacktrace >> "$LOG" 2>&1; then
    if [ -f "$APK" ]; then
      cp "$APK" "$OUTPUT"
      {
        echo "STATUS=SUCCESS"
        echo "ATTEMPT=$i"
        echo "METHOD=$METHOD"
        echo "APK=$OUTPUT"
        echo "FINISHED=$(date)"
      } > "$REPORT"
      echo "BUILD SUCCESS. APK saved to: $OUTPUT" | tee -a "$LOG"
      exit 0
    fi

    echo "Gradle succeeded, but expected APK was not found." | tee -a "$LOG"
  else
    echo "ATTEMPT $i FAILED using: $METHOD" | tee -a "$LOG"
  fi

  echo "Next retry in $DELAY seconds." | tee -a "$LOG"
  sleep "$DELAY"
done

{
  echo "STATUS=MAX_ATTEMPTS_REACHED"
  echo "ATTEMPTS=$MAX_ATTEMPTS"
  echo "FINISHED=$(date)"
  echo "See log: $LOG"
} > "$REPORT"

echo "Maximum attempts reached. No successful APK confirmed." | tee -a "$LOG"
