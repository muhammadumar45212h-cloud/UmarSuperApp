#!/data/data/com.termux/files/usr/bin/bash

ROOT="$HOME/SuperSphere-New"

if [ ! -d "$ROOT" ]; then
  echo "Project nahi mila: $ROOT"
  exit 1
fi

cd "$ROOT" || exit 1

while true; do
  clear
  printf '\033[1;36m'
  echo '╔══════════════════════════════════════════════╗'
  echo '║        SUPER APP • CENTRAL CONTROL           ║'
  echo '╚══════════════════════════════════════════════╝'
  printf '\033[0m'
  echo "Project: $ROOT"
  echo "Time:    $(date '+%Y-%m-%d %H:%M:%S')"
  echo

  check_file() {
    if find . -maxdepth 3 -type f \
      \( -iname "$1" \) \
      ! -path './node_modules/*' \
      ! -path './.git/*' -print -quit 2>/dev/null | grep -q .; then
      printf '\033[1;32m[FOUND]\033[0m   %s\n' "$2"
    else
      printf '\033[1;33m[NOT FOUND]\033[0m %s\n' "$2"
    fi
  }

  echo '────────── SERVICE INVENTORY ──────────'
  check_file 'firebase.json' 'Firebase project config'
  check_file '*supabase*' 'Supabase files'
  check_file '*youtube*' 'YouTube integration files'
  check_file '*payment*' 'Payment files'
  check_file '*ads*' 'Ads integration files'
  check_file '*admob*' 'AdMob files'
  check_file '*ai-engine*' 'AI engine files'
  check_file '*chat*' 'Chat integration files'

  echo
  echo '────────── BACKEND FOLDERS ────────────'
  for d in api functions server; do
    if [ -d "$d" ]; then
      printf '\033[1;32m[FOUND]\033[0m   %s/\n' "$d"
      find "$d" -maxdepth 2 -type f 2>/dev/null |
        head -8 | sed 's#^#    - #'
    else
      printf '\033[1;33m[ABSENT]\033[0m  %s/\n' "$d"
    fi
  done

  echo
  echo '────────── NODE SERVER PROCESSES ──────'
  if pgrep -af 'node|npm|firebase' 2>/dev/null | grep -v 'super-control.sh' | head -8; then
    :
  else
    echo 'No matching Node/Firebase process detected.'
  fi

  echo
  echo '────────── PROJECT CHECKS ─────────────'
  if [ -d node_modules ]; then
    echo '[OK] node_modules installed'
  else
    echo '[WARN] node_modules missing'
  fi

  if [ -d android ]; then
    echo '[OK] Android project exists'
  fi

  if [ -d .git ]; then
    echo '[OK] Git repository exists'
    git status --short 2>/dev/null | head -8
  fi

  echo
  printf '\033[1;36m'
  echo 'Refresh: 5 seconds | Exit: press q'
  printf '\033[0m'

  read -r -t 5 -n 1 key || true
  if [ "${key:-}" = "q" ] || [ "${key:-}" = "Q" ]; then
    break
  fi
done

clear
echo 'Super App control panel closed.'
