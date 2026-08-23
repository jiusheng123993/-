## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## AI 能力配置（用户明确要求）

本项目的 AI 相关密钥已配置在 `03-源代码/server/.env`（如 DeepSeek `AI_API_KEY`、百炼 `BAILIAN_API_KEY`、Seedream/Seedance、微信等），统一从 `src/config.ts` 读取。

- 需要大模型对话、图像生成等 AI 能力时，直接读取这些配置并调用，不要询问用户，也不要当作未配置跳过。
- 密钥只允许存在于 .env / 环境变量中，禁止写进代码、文档或提交到 git。
- 对外调用时同样遵守"中文注释、图谱优先"等既有规则。

## 部署配置规范（用户明确要求，以后所有项目都要）

- **每个项目的部署配置统一记录在各自仓库的 `05-部署配置/部署配置.md`**（服务器信息/应用路径/PM2 进程/数据库/环境变量清单/依赖/部署步骤/监控/部署记录）。
- **密钥/密码/数据库连接串的值永不写入部署配置文档**（安全红线），只记键名与获取方式，值见服务器 `.env`。
- 部署（数据库迁移/重启/上线）后必须：①更新部署配置文档的"部署记录"表；②冒烟验证（表/接口/进程）。
- 项目服务器信息（IP/账号/路径/进程名）以部署配置文档为准，不臆造（如星河宠记 PM2 进程实际是 `xinghuanhai-server`）。
- 迁移遇 "must be owner of table"：用 `sudo -u postgres psql -d <库名>` 执行，并 `ALTER TABLE ... OWNER TO <应用用户>`。

## 项目记忆

### 2026-08-08 · 运营应急准备（与情侣消消乐同步）

- 安全与稳定现状（勿重复建设）：helmet、脱敏请求日志、分层限流（全局 60/分钟；AI 生成 5/分钟；对话 30/分钟；回忆录 3/分钟；上传 10/分钟）、JWT 启动校验、PM2 自动重启 + 内存保护、zod 校验、CORS 白名单、微信支付回调 raw body 验签。
- 新增文档：`01-产品文档/运营应急预案.md`（风险全景 + 上线前检查清单 P0/P1/P2 + 按场景应急流程 + 联系人表待填）。
- 服务器监控：与情侣消消乐共用一台服务器，监控脚本由情侣消消乐仓库维护：`E:\情侣消消乐\05-部署配置\monitor.sh`（健康/磁盘/证书/内存 + 微信告警，cron 每 5 分钟）。
- 待办（P0 级）：AI 算力余额告警、数据库备份异地副本 + 恢复演练、支付订单每日对账、上传目录容量监控。
- 用户明确要求：两个项目（情侣消消乐、星河宠记）均为用户所有，运营应急准备要同步推进；本条目即项目记忆，后续新进展继续追加在这里。

### 2026-08-23 · 知识图谱全流程 + 监控备份体系（重要里程碑）

**功能落地（三阶段设计全部实现，服务端已部署）**
- Phase1 医学知识图谱 + 置信度（`miniapp/src/data/petKnowledge/medicalGraph.ts`，前端静态兜底）；Phase2 会员 AI 深度分析 + 记忆闸门召回（服务端 `symptomAiService.ts`）；Phase3 图谱热更新（服务端权威 + `setActiveGraph` 切换）+ 用户纠错 + 审核后台（`/admin`，ADMIN_TOKEN）；恢复事件记忆闭环；聊天 `check_symptom` 消费权威图谱（`graphEvaluator.ts`）。设计文档：`01-产品文档/宠物医学知识图谱与置信度-设计方案-2026-08-22.md`。
- Agent 对话成本日志（AI 算账）：`agent_conversation_logs` 表记录每轮对话意图/工具链/token/耗时（try/finally 兜底客户端断开），可回答"每用户每天烧多少 AI 钱"。

**监控与备份（2026-08-23 补齐 P0 缺口，服务器 49.232.203.85）**
- 监控（5 分钟 cron + 微信告警，`/srv/ops/monitor.sh`）：双 API 健康/PostgreSQL/磁盘/内存/证书。
- 数据库备份（每日 3 点）：`backup-xinghuanhai.sh` 备份 xinghuanhai 库（**此前只有 qinglv 库有备份，xinghuanhai 无备份是 P0 缺口，已修复**），保留 15 份，失败告警。
- 异地备份（每日 7 点本地计划任务 `XHH-Backup-Pull`）：`05-部署配置/backup-local-pull.js` 免密 SSH 拉取到 `E:\Backups\xinghuanhai\`（保留 30 份）；已校验 checksum 与服务器一致。
- AI 余额告警（每日 9 点）：DeepSeek <¥10 告警（当前 ¥73.21）；支付对账（每日 9:30）：异常告警。
- **恢复演练已验证**：备份还原临时库成功（56 表 + 关键表数据完整）。
- 运维脚本唯一事实源：`05-部署配置/monitor/`（git 管理），服务器 `/srv/ops/` 为生产副本。
- 待补：恢复演练已做一次（建议定期复演）；ARK/百炼/Seedream 余额告警需控制台 AK/SK；**root 密码曾暴露于聊天记录，建议尽快改密**。

### 2026-08-23 · 修复"点击 AI 周报报错"（前后端契约不匹配）

- **根因**：后端 `/api/families/:id/weekly-reports/latest` 等返回表行结构 `{id, family_id, week_number, year, report_data(JSONB), ai_insight, share_card_url, created_at}`，而周报详情页 `pagesPet/weekly-report/index.tsx` 此前按扁平视图结构 `{report_date, overall_mood, summary, highlights, concerns, pet_summaries}` 消费，`report.highlights.length` 访问 undefined → 前端渲染 TypeError，点击入口白屏。线上佐证：接口 200/304 无 500（库内 1 条周报，family 5f7f693d…，2026 第 32 周）。
- **修复（纯前端）**：`services/weeklyReportService.ts` 新增 `BackendReportRow` 接口 + `mapBackendReportRowToView()` 映射（ISO 周计算与后端同算法；highlights/concerns/overallMood 由 report_data 生成；缺 report_data 容错全 0），三个 service API 内部统一映射；周报页改用映射后结构，2x2 取后端真实聚合，成员小结卡空时隐藏；补 5 单测。
- **验证**：小程序 typecheck ✅、周报 46 测试 ✅、全量 2330 passed（仅余既有 avatarPresets 无关失败）✅、eslint 0 error ✅。改动未提交。
- **遗留建议**：后端聚合扩展 per-pet 明细（report_data 加 pets 数组）后前端自动显示"成员健康小结"；首页 family 周报预览 state 未渲染可后续接入。

### 2026-08-24 · 修复"添加宠物选择照片无反应"（隐私授权双机制冲突）

- **根因**：`miniapp/src/utils/privacy.ts` 手动调用 `Taro.requirePrivacyAuthorize`（主动隐私授权方案），与 `app.js` 已注册的 `Taro.onNeedPrivacyAuthorization`（被动方案，全局 PrivacyPopup）混用——微信官方规定两种方案**二选一**。未授权用户点击选图时授权流程被干扰，失败错误未命中代码里仅有的 errno 112 / 含 privacy 两个识别分支，被 `pagesPet/add/index.tsx` 的静默 catch（仅 console.warn）吞掉 → 表现为"点击选择照片无反应"。
- **修复（纯前端 2 文件 + 1 新测试）**：①`privacy.ts` 去掉 `requirePrivacyAuthorize`，统一走被动机制（chooseImage 在用户未授权时自动触发 `onNeedPrivacyAuthorization` → 全局 PrivacyPopup → 用户同意后微信自动放行并继续选图），并补全失败反馈（用户取消静默 / errno 112 弹 modal 提示开发者 / 拒绝隐私授权 toast / 其他失败 toast「选择照片失败，请重试」，杜绝静默无反应）；②`add/index.tsx` `handleChooseAvatar` 补 `tempFilePaths` 空数组保护；③新增 `src/utils/__tests__/privacy.test.ts` 6 用例（正常/取消/112/拒绝/其他失败/异常错误对象）。
- **验证**：tsc 0 错误 ✅、privacy 6 测试全过 ✅、全量 2361 passed（唯一失败为既有 avatarPresets 数据资产问题，与本次无关）✅、改动文件 eslint 无新增错误（add/index.tsx 的 2 个 import/first error 为既有问题，stash 证实）✅、graphify 图库已更新 ✅。改动未提交。
- **遗留**：avatarPresets 既有失败（品牌头像库 URL 断言）待后续排查；`add/index.tsx` 既有 lint error 待清理。

### 2026-08-24 · 体验版图片不显示/上传失败（webp 真机兼容 + nginx 静态资源 404 + 隐私声明）

**现象**：体验版登录主图/品牌 logo/宠物预选头像不显示（模拟器正常、安卓真机空白）；"所有照片都无法上传"（实际是选图阶段被拦）。同时挖出隐藏 bug：已上传照片（jpg/png）公网一直 404。

**根因链（三个独立问题）**：
1. **webp 真机兼容性**：微信安卓真机对 webp（尤其 VP8X+ALPH 带透明通道）解码兼容性差，模拟器（Chromium 内核）正常、真机空白。本地 23 张 webp（登录主图 VP8 / logo+预选头像 VP8X+ALPH）+ 服务器 home-style 20 张全受影响。
2. **nginx 静态资源 404（隐藏 bug，本次最严重发现）**：`nginx-xinghuanhai.conf` 的 `location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff2?)$` 只加缓存头、**无回退**，/uploads/** 实际由 Express 托管（磁盘 /opt/xinghuanhai/server/uploads），nginx 正则拦截后只在 /var/www/xinghuanhai 找 → 公网 404；webp 不在该正则内走 `try_files → @backend` 反而正常——解释"webp 能加载、png 404"的怪象。**修复**：静态资源 location 加 `try_files $uri @backend;`（官网磁盘文件优先，/uploads 回退后端）。⚠️ 此 bug 意味着**此前所有用户上传的 jpg/png 照片公网都加载不出来**，本次一并修复。
3. **隐私声明 errno 112**：`chooseImage:fail api scope is not declared in the privacy agreement`（errno 112）= 微信后台《用户隐私保护指引》未声明选图接口，真机/体验版强制拦截（模拟器不校验）。前端 `privacy.ts` 已正确捕获并弹 modal 提示开发者；需用户在 mp.weixin.qq.com「设置 > 隐私保护设置」声明相册/相机权限——用户已确认配置完成。

**修复（前端 23 图转 PNG + 服务器传 PNG + nginx 修复）**：
- 本地 23 张 webp → PNG（Pillow，保留 alpha；预选头像 160px + 256 色调色板，20 张 1736KB→175KB，分包 pagesPet 1.80MB 保持微信 2MB 限内；登录主图 322KB 警告仅 webpack 提示不影响）
- `homeStyleAvatars.ts` URL 后缀 .webp→.png；`avatarPresets.ts`/`AiAvatar.tsx`/`LogoLoading.tsx`/`login/index.tsx` import 全改；webp 源文件删除
- 服务器 home-style 20 张补传 PNG（备份 home-style.bak-20260824024517），nginx 配置已修并 reload
- 测试断言同步（homeStyleAvatars.test / PresetAvatar.test / avatarPresets.test——后者原"服务端 https URL"断言与本地资源实现脱节，修正为本地 preset-home png 断言，全量 2361 passed 唯一既有失败消除）

**验证**：构建成功 ✅、主包 1.47MB/pagesPet 1.80MB/pagesUser 0.85MB ✅、公网 png 头像 200 ✅、官网/管理后台回归 200 ✅、webp 旧链接兼容 ✅、前端 2361 测试全绿 ✅。改动未提交。
