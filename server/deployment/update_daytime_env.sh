#!/usr/bin/env bash
# Atomic update script for production environment file used by systemd
# Usage (run as root or with sudo):
# sudo DATABASE_URL='postgresql://postgres:pwd@db:5432/daytime_hub' \
#      SENDGRID_API_KEY='SG.xxxxx' \
#      ADMIN_USER='AdminUserDTH' \
#      ADMIN_PASS='YourNewStrongPassword' \
#      /usr/local/bin/update_daytime_env.sh

set -euo pipefail

DEST_DIR="/etc/daytime-hub"
DEST_FILE="$DEST_DIR/daytime.env"

if [ -z "${DATABASE_URL-}" ] || [ -z "${SENDGRID_API_KEY-}" ] || [ -z "${ADMIN_PASS-}" ]; then
  echo "Error: required environment variables DATABASE_URL, SENDGRID_API_KEY, ADMIN_PASS must be provided." >&2
  exit 1
fi

echo "Preparing atomic update of $DEST_FILE"
TMPFILE=$(mktemp /tmp/daytime.env.XXXX)
chmod 600 "$TMPFILE"

cat > "$TMPFILE" <<EOF
PORT=3000
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}
SENDGRID_API_KEY=${SENDGRID_API_KEY}
EMAIL_FROM=${EMAIL_FROM-}
EMAIL_TO=${EMAIL_TO-}
ADMIN_USER=${ADMIN_USER-AdminUserDTH}
ADMIN_PASS=${ADMIN_PASS}
EOF

mkdir -p "$DEST_DIR"
chown root:root "$TMPFILE"
mv "$TMPFILE" "$DEST_FILE"
chown root:root "$DEST_FILE"
chmod 600 "$DEST_FILE"

echo "Reloading systemd and restarting service daytime-hub (if present)"
if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload || true
  systemctl restart daytime-hub || echo "Warning: failed to restart daytime-hub (service may not exist)"
fi

echo "Environment updated at $DEST_FILE"
