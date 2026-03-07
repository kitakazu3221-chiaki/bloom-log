#!/usr/bin/env bash
set -euo pipefail

# ── Bloom Log デプロイスクリプト ──
# ローカルからVPSへデプロイ
# 使い方: VPS_IP=133.88.123.67 bash scripts/deploy.sh

VPS_IP="${VPS_IP:?VPS_IP を指定してください（例: VPS_IP=133.88.123.67 bash scripts/deploy.sh）}"
VPS_USER="${VPS_USER:-bloomlog}"
APP_DIR="/home/$VPS_USER/app"

echo "=== Bloom Log デプロイ ==="
echo "対象: $VPS_USER@$VPS_IP:$APP_DIR"
echo ""

# 1. ローカルでビルド
echo ">> ローカルビルド中..."
npm run build

# 2. VPS へファイル転送
echo ">> ファイル転送中..."
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='certs/' \
  --exclude='server/data/' \
  ./ "$VPS_USER@$VPS_IP:$APP_DIR/"

# 3. VPS 上でインストール＆再起動
echo ">> VPS 上でインストール＆再起動中..."
ssh "$VPS_USER@$VPS_IP" "cd $APP_DIR && npm install --omit=dev && pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs && pm2 save"

echo ""
echo "=== デプロイ完了 ==="
echo "https://bloom-log.com でアクセスできます"
