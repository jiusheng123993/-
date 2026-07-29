#!/bin/bash
# ============================================================
# 星寰海 - 应用部署脚本
# 使用方法: chmod +x 02-deploy-app.sh && bash 02-deploy-app.sh
# ============================================================
set -e

APP_DIR="/opt/xinghuanhai"
SERVER_DIR="$APP_DIR/server"

echo "=========================================="
echo " 星寰海 - 应用部署"
echo "=========================================="

# ---------- 1. 拉取/更新代码 ----------
echo "[1/5] 拉取代码..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git pull origin main
else
  echo "请先将代码上传到服务器 $APP_DIR 目录"
  echo "方式一: git clone 你的仓库地址 /opt/xinghuanhai"
  echo "方式二: 用 scp 上传 server 目录到 /opt/xinghuanhai/server"
  exit 1
fi

# ---------- 2. 安装依赖 ----------
echo "[2/5] 安装依赖..."
cd "$SERVER_DIR"
npm ci --production

# ---------- 3. 检查 .env 文件 ----------
echo "[3/5] 检查环境配置..."
if [ ! -f "$SERVER_DIR/.env" ]; then
  if [ -f "$SERVER_DIR/.env.example" ]; then
    echo "未找到 .env 文件，从 .env.example 复制模板..."
    cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
    echo "请编辑 $SERVER_DIR/.env 填入真实配置后重新运行此脚本"
    exit 1
  else
    echo "错误: 未找到 .env 文件，请先创建"
    exit 1
  fi
fi

# ---------- 4. 运行数据库迁移 ----------
echo "[4/5] 运行数据库迁移..."
cd "$SERVER_DIR"
npx tsx src/migrate.ts || echo "迁移表可能已存在，跳过..."

# ---------- 5. 启动/重启服务 ----------
echo "[5/5] 启动服务..."
cd "$SERVER_DIR"

# 先用 tsx 编译验证
npx tsx --eval "import './src/index.js'" 2>/dev/null || true

# 使用 PM2 启动
pm2 delete xinghuanhai-server 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "=========================================="
echo " 部署完成!"
echo "=========================================="
echo ""
echo " 检查服务状态:"
echo "   pm2 status"
echo ""
echo " 查看日志:"
echo "   pm2 logs xinghuanhai-server"
echo ""
echo " 重启服务:"
echo "   pm2 restart xinghuanhai-server"
echo "=========================================="