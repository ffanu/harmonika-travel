#!/usr/bin/env bash
# Build locally, then deploy the Next.js standalone output to the VPS.
#
#   SSH_HOST=103.157.24.189 SSH_PORT=2016 SSH_USER=root \
#   APP_DIR=/home/www.harmonikatravel.com/app \
#   ./scripts/deploy.sh
#
# The remote .env is preserved across deploys: it is never generated here and
# never committed. Create it once (see README) before the first deploy.
set -euo pipefail

SSH_HOST="${SSH_HOST:?set SSH_HOST}"
SSH_PORT="${SSH_PORT:-22}"
SSH_USER="${SSH_USER:-root}"
APP_DIR="${APP_DIR:-/home/www.harmonikatravel.com/app}"
SERVICE="${SERVICE:-harmonikatravel.service}"
ARCHIVE="/tmp/harmonika-travel-standalone.tgz"
TARGET="/tmp/harmonika-travel-standalone.tgz"

echo "==> build"
npm run lint
npm run typecheck
npm run build

echo "==> package"
rm -f "$ARCHIVE"
tar czf "$ARCHIVE" --exclude=".next/standalone/public/images/*.png" .next/standalone prisma scripts/seed.mjs scripts/seed-catalog.mjs scripts/catalog-data.mjs
gzip -t "$ARCHIVE" # fail fast on a truncated archive
ls -la "$ARCHIVE" | awk '{printf "    archive: %.1f MB\n", $5/1048576}'

echo "==> upload"
scp -P "$SSH_PORT" "$ARCHIVE" "$SSH_USER@$SSH_HOST:$TARGET"

echo "==> extract and restart"
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" bash -s <<REMOTE
set -euo pipefail
APP="$APP_DIR"
STANDALONE="\$APP/.next/standalone"
if [ -f "\$STANDALONE/.env" ]; then
  cp "\$STANDALONE/.env" /tmp/harmonika-travel.env.keep
  KEEP=1
else
  KEEP=0
fi
mkdir -p "\$APP"
rm -rf "\$APP/.next" "\$APP/prisma" "\$APP/scripts"
tar xzf "$TARGET" -C "\$APP"
if [ "\$KEEP" = "1" ]; then
  cp /tmp/harmonika-travel.env.keep "\$STANDALONE/.env"
  chmod 600 "\$STANDALONE/.env"
else
  echo "PERINGATAN: .env belum ada di \$STANDALONE; aplikasi tidak akan bisa konek DB." >&2
fi
for helper in seed.mjs seed-catalog.mjs catalog-data.mjs; do
  cp "\$APP/scripts/\$helper" "\$STANDALONE/\$helper" 2>/dev/null || true
done
chown -R www-data:www-data "\$APP"
systemctl restart "$SERVICE"
sleep 6
systemctl is-active "$SERVICE"
curl -fsS -m 8 -o /dev/null -w "health=http_%{http_code}\n" http://127.0.0.1:3401/api/health
REMOTE

echo "==> verify public endpoint"
curl -fsS -m 15 -o /dev/null -w "public=https_%{http_code}\n" https://www.harmonikatravel.com/api/health

echo "==> done. Cek rollback di README bila ada masalah."