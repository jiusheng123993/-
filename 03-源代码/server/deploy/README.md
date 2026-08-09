# 星河宠记后端 · 线上部署说明（2026-08-08 实测）

## 服务器现状

- 服务器：49.232.203.85（与情侣消消乐共用一台）
- 部署目录：`/opt/xinghechongji/server`
- 进程管理：**PM2**（应用名 `xinghechongji-server`，root 运行）
  - 启动方式：`node --import tsx src/index.ts`（直接跑 src，不用 dist）
  - 重启：`sudo pm2 restart xinghechongji-server --update-env`
- 域名入口：`https://api.xinghuanhai.com`（nginx 配置在 `/etc/nginx/sites-enabled/xinghechongji`，
  官网静态页 + `location @backend` 反代到 `127.0.0.1:3000`，含 WebSocket 升级与 20M 上传限制）
- 证书：Let's Encrypt 泛域名 `*.xinghuanhai.com`（`/etc/letsencrypt/live/xinghuanhai.com/`）
- 环境变量：`/opt/xinghechongji/server/.env`（密钥只存在这里，部署时不要覆盖）

## 更新部署步骤（已按此流程执行过）

1. 本地打包 `src/`（排除 `__tests__` 与 `*.test.ts`）：
   ```bash
   tar -czf xhh-src.tgz --exclude='src/__tests__' --exclude='*.test.ts' src
   ```
2. 上传到服务器 `/tmp/xhh-src.tgz`（scp，用 qxl_deploy_key）
3. 服务器执行：
   ```bash
   APP=/opt/xinghechongji/server
   sudo cp -a "$APP/src" "$APP/src.bak.$(date +%Y%m%d)"   # 备份旧 src
   sudo rm -rf "$APP/src" && sudo mkdir -p "$APP"          # 注意：解包到 $APP（包里根目录就是 src/）
   sudo tar xzf /tmp/xhh-src.tgz -C "$APP"
   sudo chown -R root:root "$APP/src"
   sudo pm2 restart xinghechongji-server --update-env
   curl -s http://127.0.0.1:3000/api/health
   ```
4. 验证公网：`curl https://api.xinghuanhai.com/api/health`

## 坑点记录

- 解包层级：tgz 根目录就是 `src/`，必须 `-C /opt/xinghechongji/server`，否则会变成 `src/src` 导致启动失败
  （`ERR_MODULE_NOT_FOUND .../src/index.ts`）。
- 不要在 `/etc/nginx/conf.d/` 再建 `api.xinghuanhai.com` 的 server 块，
  与 `sites-enabled/xinghechongji` 冲突会被 nginx 忽略。
- 已砍衣柜功能的服务端文件（wardrobe/themeSuite 路由与服务）已从线上 src 删除。
