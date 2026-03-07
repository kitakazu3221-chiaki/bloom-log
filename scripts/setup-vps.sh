#!/usr/bin/env bash
set -euo pipefail

# ── Bloom Log VPS セットアップスクリプト ──
# Ubuntu 22.04 / 24.04 用
# 使い方: ssh root@YOUR_IP 'bash -s' < scripts/setup-vps.sh

echo "=== Bloom Log VPS Setup ==="

# 1. システム更新
echo ">> システム更新中..."
apt update && apt upgrade -y

# 2. 基本パッケージ
apt install -y curl git ufw

# 3. Node.js 20 LTS インストール（NodeSource）
echo ">> Node.js 20 LTS インストール中..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# 4. PM2 インストール
echo ">> PM2 インストール中..."
npm install -g pm2

# 5. Caddy インストール
echo ">> Caddy インストール中..."
if ! command -v caddy &> /dev/null; then
  apt install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt update
  apt install -y caddy
fi
echo "Caddy: $(caddy version)"

# 6. アプリ用ユーザー作成
echo ">> アプリ用ユーザー作成中..."
if ! id "bloomlog" &> /dev/null; then
  useradd -m -s /bin/bash bloomlog
  echo "ユーザー 'bloomlog' を作成しました"
else
  echo "ユーザー 'bloomlog' は既に存在します"
fi

# 7. アプリディレクトリ作成
APP_DIR="/home/bloomlog/app"
mkdir -p "$APP_DIR"
chown bloomlog:bloomlog "$APP_DIR"

# 8. ファイアウォール設定
echo ">> ファイアウォール設定中..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
echo "y" | ufw enable
ufw status

# 9. PM2 自動起動設定
echo ">> PM2 自動起動設定中..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u bloomlog --hp /home/bloomlog

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "  1. ドメインの DNS A レコードに VPS の IP を設定"
echo "  2. scripts/deploy.sh でアプリをデプロイ"
echo "  3. /etc/caddy/Caddyfile を設定"
echo ""
