#!/bin/bash
# ============================================================
# 星河宠记 - 服务器环境初始化脚本
# 适用于 Ubuntu 20.04+ / Debian 11+
# 使用方法: chmod +x 01-server-setup.sh && sudo bash 01-server-setup.sh
# ============================================================
set -e

echo "=========================================="
echo " 星河宠记 - 服务器环境初始化"
echo "=========================================="

# ---------- 1. 更新系统 ----------
echo "[1/8] 更新系统包..."
apt-get update -y && apt-get upgrade -y

# ---------- 2. 安装基础工具 ----------
echo "[2/8] 安装基础工具..."
apt-get install -y curl wget git build-essential ufw

# ---------- 3. 安装 Node.js 20 LTS ----------
echo "[3/8] 安装 Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js $(node -v) 安装完成"
echo "npm $(npm -v) 安装完成"

# 安装 PM2 进程管理器
npm install -g pm2
echo "PM2 $(pm2 -v) 安装完成"

# ---------- 4. 安装 PostgreSQL ----------
echo "[4/8] 安装 PostgreSQL..."
if ! command -v psql &> /dev/null; then
  apt-get install -y postgresql postgresql-contrib
fi
systemctl enable postgresql
systemctl start postgresql
echo "PostgreSQL 安装完成"

# 创建数据库和用户（如果不存在）
echo "[4/8] 配置数据库..."
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='xinghechongji'\" | grep -q 1 || psql -c \"CREATE USER xinghechongji WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';\""
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='xinghechongji'\" | grep -q 1 || psql -c \"CREATE DATABASE xinghechongji OWNER xinghechongji;\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE xinghechongji TO xinghechongji;\""
echo "数据库 xinghechongji 创建完成"

# ---------- 5. 安装 Nginx ----------
echo "[5/8] 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi
systemctl enable nginx
systemctl start nginx
echo "Nginx 安装完成"

# ---------- 6. 安装 Certbot（SSL 证书）----------
echo "[6/8] 安装 Certbot..."
apt-get install -y certbot python3-certbot-nginx
echo "Certbot 安装完成"

# ---------- 7. 配置防火墙 ----------
echo "[7/8] 配置防火墙..."
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw --force enable
echo "防火墙配置完成"

# ---------- 8. 创建项目目录 ----------
echo "[8/8] 创建项目目录..."
mkdir -p /opt/xinghechongji
mkdir -p /opt/xinghechongji/uploads
chmod 755 /opt/xinghechongji

echo ""
echo "=========================================="
echo " 环境初始化完成!"
echo "=========================================="
echo ""
echo " 已安装:"
echo "   - Node.js $(node -v)"
echo "   - npm $(npm -v)"
echo "   - PM2 $(pm2 -v)"
echo "   - PostgreSQL $(psql --version | head -1)"
echo "   - Nginx $(nginx -v 2>&1 | grep -oP 'nginx/\K[\d.]+')"
echo "   - Certbot"
echo ""
echo " 数据库信息:"
echo "   用户名: xinghechongji"
echo "   数据库: xinghechongji"
echo "   密码: CHANGE_ME_STRONG_PASSWORD  <-- 请修改这个密码!"
echo ""
echo " 下一步: 运行 02-deploy-app.sh 部署应用"
echo "=========================================="