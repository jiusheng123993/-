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
