#!/usr/bin/env bash
# Auditsmith production setup for a fresh Ubuntu 22.04/24.04 box.
# Run as root, once:  bash setup.sh
set -e

echo "== 1. System packages =="
apt-get update -y
apt-get install -y curl git caddy fonts-liberation

echo "== 2. Node 22 =="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "== 3. The app =="
id -u audit &>/dev/null || useradd -m -s /bin/bash audit
sudo -u audit bash << 'INNER'
cd ~
if [ ! -d auditsmith ]; then
  # REPLACE with your repo URL if different
  git clone https://github.com/mohamedaaqib3005/auditsmith.git
fi
cd auditsmith
npm install
npx playwright install chromium
INNER
# system deps for chromium
sudo -u audit npx --prefix /home/audit/auditsmith playwright install-deps chromium || npx playwright install-deps chromium

echo "== 4. Keys =="
echo "Now create /home/audit/auditsmith/.env with your three keys"
echo "(PSI_KEY=..., OPR_KEY=..., PREFETCH_KEY=...). BRAND_CREDITS stays off"
echo "unless you want public audits spending brand-API credits."

echo "== 5. Service =="
cp /home/audit/auditsmith/deploy/auditsmith.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable auditsmith

echo "== 6. HTTPS front door =="
echo "Edit /home/audit/auditsmith/deploy/Caddyfile: put your real domain on line 1,"
echo "then: cp /home/audit/auditsmith/deploy/Caddyfile /etc/caddy/Caddyfile && systemctl restart caddy"

echo
echo "When .env exists:  systemctl start auditsmith"
echo "Logs:              journalctl -u auditsmith -f"
