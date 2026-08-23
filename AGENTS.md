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

## 提示词技能（用户明确要求：所有提示词任务先加载）

- **`pet-prompt-engine` 技能**：`E:\星河宠记\.dsh\skills\pet-prompt-engine\SKILL.md`（提示词库《宠物回忆录-提示词库.md》的可执行固化版）。
- **凡是涉及 AI 提示词的任务（生图/头像/全家福/表情包/回忆录视频分镜/写提示词测试）必须先加载该技能**，按公式完整组装，禁止各写各的、禁止遗漏环节（主体+外貌+表情+画风+氛围+画质+角色锁定+主体锁定）。
- 代码调用点索引见技能 §三/§九：公共约束 `petPrompt.ts`、画风/表情/外貌提取 `avatarService.ts`、全家福 `familyPhotoService.ts`、回忆录 `promptTemplates.ts`、前端模板 `avatar-customize/index.tsx`。
- 金科玉律：宠物名字绝不进提示词（「烧鸡」事故）、外貌写具体（§0.9，有照片自动提取）、数量锁定、参考图一致性、清洗兜底。

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

### 2026-08-24 · 修复"兑换码兑换不成功"（前端路径缺 /api 前缀）

- **根因**：`pagesUser/member/index.tsx` 兑换调用 `api.post('/redeem', ...)`，但服务端所有业务路由挂在 `/api` 前缀下（`app.use('/api', redeemRoutes)` → 真实路径 `/api/redeem`）→ 生产请求 `https://api.xinghuanhai.com/redeem` 返回 nginx 层 404 → 被 `handleRedeem` 的 catch 吞成「兑换失败，请检查兑换码」，掩盖真实原因。用户输入合法码（如 XHH-L7GA-BX85-SA9E，格式符合生成器且无 I/O/0/1）也必然失败。生产探测实证：POST /redeem → 404，POST /api/redeem → 401（路由存在，auth 拦截）。
- **修复（纯前端 1 文件）**：`member/index.tsx` 兑换路径 `/redeem` → `/api/redeem`；catch 透传服务端错误信息（区分「兑换码不存在或已被使用」/「兑换码已被使用」/网络异常），不再笼统提示。
- **顺带排查**：`services/api.ts` 的 `getPets/getMembership/createPet/updatePet/deletePet` 同样缺 `/api` 前缀，但全仓无调用方（死方法，实际走 petService/membershipService 的 `/api` 前缀路径），不影响线上，待清理。
- **验证**：tsc 0 错误 ✅、全量 2362 passed / 0 failed（exit 0，含此前 avatarPresets 既有失败已修复）✅、graphify 图库已更新 ✅。改动未提交。
- **待办（用户侧）**：微信开发者工具重新编译后再试兑换码；若仍失败需查生产 `redeem_codes` 表该码状态（unused/used/不存在）。

### 2026-08-24 · 家庭图谱新增"人关系"（情侣/父女等）+ 「我的」页家庭卡

- **需求**：养宠人多（情侣/父女/母子等），家庭图谱应体现"人"的家庭角色关系。方案确认=8 种标准关系（couple 情侣/father_daughter 父女/father_son 父子/mother_daughter 母女/mother_son 母子/siblings 兄弟姐妹/friends 朋友/other 其他）+ 任意两人之间可设（有向：user_id_a 是关系主体）。
- **实现**：①迁移 027 新建 `family_user_relations`（UNIQUE(family_id, LEAST(a,b), GREATEST(a,b)) 防同一对重复）；②后端 `FamilyUserRelationRepository`（listRelations JOIN 双方昵称头像 / createRelation ON CONFLICT 防重 / removeRelation 归属校验）+ families.ts 3 路由（GET/POST/DELETE /:id/user-relations，读=成员、写删=仅 owner）+ schema 枚举 + 11 接口测试；③前端 familyTypes/familyService/familyStore 扩展关系 CRUD；④图谱页新增「👥 家庭成员（人）」卡（人节点带创建者/成员徽章 + 关系列表 emoji/方向箭头，owner 可添加/删除）；⑤「我的」页新增家庭信息卡（家庭名/成员数/我的角色，无家庭引导创建，useDidShow 切回刷新）。
- **验证**：服务端 tsc 0 错误 + 新测试 11/11 + 全量 915 passed ✅；前端 tsc 0 错误 + 全量 2362 passed + build:weapp 成功 + dist 确认含新功能 ✅；graphify 已更新 ✅。
- **待部署（用户确认后）**：迁移 027 + 后端代码需部署生产；前端已在 dist 但需微信开发者工具重新编译预览。

### 2026-08-24 · 修复家庭图谱"指向父母却指向自己"（前后端契约不匹配）

- **现象**：点击可乐，烧鸭（可乐的妈妈）不显示，连接线指向可乐自己。
- **根因**：前端 `familyTreeService.getLineageTree` 的 `LineageTreeResponse` 期望 `{pet_id, ancestors, descendants, siblings}`，后端 `getLineage` 实际返回 `{pet, parents, children, siblings, mates, ancestors_levels, descendants_levels}` → 前端 `lineage.ancestors/descendants` 为 undefined（祖辈/后代行空），同代行又被旧代码 `isCurrentRow && selectedNode` 强制只渲染选中宠物 → 图谱只剩可乐自己，父母根本没渲染，连接线视觉上指向可乐。
- **修复（纯前端 2 文件）**：①`familyTreeService.ts`：`LineageTreeResponse` 对齐后端契约 + `toTreeNode` 统一映射（pet_id/pet_name/pet_avatar_url/pet_species）+ `getLineageTree` 全量转换；②`family-tree/index.tsx`：TREE_ROWS 改「第一代·父母 / 第二代·同代 / 第三代·子女」，渲染按行组装（父母行=parents、同代行=选中宠物自己+兄弟姐妹去重、子女行=children），删除强制自渲染逻辑。
- **验证**：tsc 0 错误 ✅、全量 2362 passed ✅、build:weapp 成功 ✅、graphify 已更新 ✅。改动未提交。
- **效果**：点击可乐 → 第一行显示父母（含妈妈烧鸭），连接线指向正确。

### 2026-08-24 · 家族图谱"指向父母却指向布丁"= 数据库脏数据（已删）

- **现象**：用户点击可乐，本该指向父母（烧鸭）的手势/连线却指向了布丁（布丁出现在可乐"配偶"层、总览视图多一条"💞 配偶"连线）。
- **排查（SSH 生产只读查询）**：血缘正确（pet_lineage：烧鸭 7c0468be → 可乐、烧鸭 → 布丁，可乐布丁同窝兄妹）；但 pet_relationships 存在**错误 mate 关系**（93b95cf5…，可乐↔布丁，2026-08-23 00:35 创建，疑为当时测试添加关系误选"伴侣"）→ "配偶"层/连线错误指向布丁。
- **处置（用户确认后执行）**：`DELETE FROM pet_relationships WHERE id='93b95cf5…'`（DELETE 1）→ 复查涉及可乐/布丁的关系 0 条、血缘 2 条不受影响；无代码改动、无重启；部署记录已更新。
- **验证**：数据复查通过 ✅。用户前端重新编译/刷新即可见：可乐/布丁配偶层清空，布丁只出现在"手足"层（兄妹），"父母"手势正确指向烧鸭。
- **遗留建议**：产品层可加防御——添加关系时禁止把血缘兄弟姐妹设为配偶（防止同类脏数据）；"添加关系"面板可加确认弹窗提示所选双方已有血缘关系。

### 2026-08-24 · 家庭图谱无父母时指向铲屎官（动态行渲染）

- **现象**：点击烧鸭（无父母/无子女数据）时，图谱顶部仍渲染固定「第一代 · 父母」标题行 + 连接线，指向上方空气。
- **修复（纯前端 1 文件 + 样式）**：`pagesPet/family-tree/index.tsx` 三代行改为**动态组装**（删除固定 TREE_ROWS 常量）——父母行有数据显示父母、**无数据（无祖先）→ 显示「🏠 铲屎官」根节点**（复用 ft-node 结构 + 金色渐变头像 `ft-avatar--owner` + 昵称 + "家长"徽章，连接线指向下方宠物）；同代行=选中宠物自己 + 兄弟姐妹去重；子女行无数据不渲染；空数据行不再显示标题/手势。
- **验证**：tsc 0 错误 ✅、全量 2376 passed / 0 failed ✅、build:weapp 成功 ✅、graphify 已更新 ✅。改动未提交。
- **效果**：点击烧鸭 → 图谱顶部显示"🏠 铲屎官"（主人）并指向烧鸭，不再有指向空气的"父母"手势。

### 2026-08-24 · 全家福 AI 生成"四只猫生成一只鸡"修复 + 全量生图提示词接入提示词库（已提交已部署）

- **现象**：用户全家福生成的照片奇怪——四只猫生成一只鸡（其中一只猫名叫「烧鸡」），并质疑提示词未按提示词库做（判断正确）。
- **根因**：`familyPhotoService.ts` 的 `buildPrompt` 把宠物**名字**拼进英文提示词（`a ${breed} 猫咪 named ${name}`）——「烧鸡」在文生图模型里就是烧鸡（roast chicken），且会把 4 张参考猫图覆盖成只画一只鸡；同时 `STYLE_PROMPTS` 是硬编码简版英文模板（注释声称"参考项目提示词库"但实际未接入《宠物回忆录-提示词库.md》），且提示词无数量、无角色一致性、品种为空会出空串。
- **修复**：①新增 `server/src/services/petPrompt.ts` 提示词公共模块（固化提示词库 §0.6 全局角色锁定表 / §四 角色一致性模板：`petSubjectText` 品种兜底+清洗截断 20 字+**绝不写名字**、`PET_IDENTITY_KEEP` 毛色/花纹/体型/五官锁定参考图、`PET_ONLY_ONE` 只出现一只防加戏）；②`familyPhotoService.ts` 重写 `buildPrompt`：名字退出提示词（只存入库 member_names）、中文"品种+物种"逐只描述、明确数量（如"4只猫咪"）、参考图一致性+主体锁定、"以参考照片为准"仅在真有参考图时才写（修掉"无图却要求完全一致"的说谎）；`STYLE_PROMPTS` 六风格关键词改为基于提示词库 §六 官方风格关键词；③`image2DService.ts`（96 张表情包）与 `avatarService.ts`（多风格候选+旧单张）统一改用 petPrompt；④测试：新增 `familyPhotoService.test.ts` 8 用例 + `petPrompt.test.ts` 7 用例（「烧鸡」/chicken/roast/named 均禁止进 prompt、数量明确、品种兜底、猫狗混合计数、images 数组透传断言），修正"所有合法风格"用例补全 mock 断言 200（消除对"恰好500≠400"脆弱依赖与日志噪声）；⑤双 Agent 审查通过（无阻塞），5 条建议全部处理（注释措辞/参考图条件化/品种清洗/用例加固/images 断言）。
- **验证**：服务端 tsc 0 错误 ✅、全量 931 passed / 62 文件 ✅、相关 50 测试全过 ✅、graphify 已更新 ✅。
- **提交**：`32f0c7e fix(全家福): 宠物名字退出生图提示词，全量生图接入提示词库`（7 文件 +369/-42，分支 develop）。
- **部署（已完成，无数据库迁移）**：上传 4 文件（petPrompt + familyPhoto/avatar/image2D）→ 备份 3 旧文件到 `/opt/xinghuanhai/src.bak.promptfix-*` → PM2 重启 `xinghuanhai-server` → 冒烟全绿（health 200、日志无 error、生产实测 buildPrompt：四只猫含「烧鸡」→ 名字/鸡类词不进提示词、数量/风格/一致性约束生效）；部署记录已更新 `05-部署配置/部署配置.md`；回滚=恢复 src.bak.promptfix-* 后重启。
- **待办（用户侧）**：小程序重新生成全家福验证（旧"鸡"图可在相册删除）；前端无改动无需重新编译。

### 2026-08-24 · 添加宠物"不确定品种"兜底 + 品种搜索面板浮于键盘上方

- **需求**：①用户可能不知道自家小猫/小狗品种（混血/串串/流浪猫狗/领养）——品种是必填，不知道就卡住；②实测添加宠物时品种搜索面板被键盘盖住，搜完结果在键盘下面，必须收起键盘才能看到。
- **实现（纯前端 5 文件 + 1 测试）**：①`data/petKnowledge/breeds.ts` 新增 `UNKNOWN_BREED_ID='unknown_mix'` / `UNKNOWN_BREED_NAME='不确定品种'` / `UNKNOWN_BREED_KEYWORDS` / `isUnknownBreedKeyword()` 关键词匹配助手——**刻意不放进 BREED_DATA 数组**，避免污染品种知识库统计（breed 列表页计数/breed-detail/趋势页均遍历 BREED_DATA），仅作表单特殊值落库（后端 breed_id 无外键无枚举，各消费方对未匹配品种均有兜底：疫苗默认方案/头像物种兜底/饮食 unknown/趋势 null）；②`pagesPet/add/index.tsx` 品种面板顶部固定「不确定品种」高亮行（初始态常显；搜索时仅当关键词命中"不确定/混血/串串/不知道/mix/unknown"才展示，空态文案联动），选中后 breedId 落 unknown_mix、不展示品种特征卡；**键盘修复**：搜索 Input `adjustPosition={false}` + `Taro.onKeyboardHeightChange` 监听键盘高度 + 弹层 overlay 内联 `paddingBottom` 抬升面板，关闭/选中时 `Taro.hideKeyboard()`（原方案靠微信自动上推不可靠）；顺带把 `updateField` 包成 useCallback 消除既有 exhaustive-deps 告警；③`pagesPet/edit/index.tsx` 品种原生 Picker 追加「不确定品种（混血/串串）」选项（index 越界分支处理），已存 unknown 宠物可回改；④`pagesPet/add/index.scss` 不确定品种行样式 + 列表 `min-height:0` 修复键盘弹起时滚动边界；⑤新增 `data/petKnowledge/__tests__/breeds.test.ts` 8 用例（不在 BREED_DATA/空词 false/关键词命中/未命中/单字部分匹配）。
- **验证**：typecheck 0 错误 ✅、全量 2371 passed / 0 failed（含新增 9 个）✅、改动文件 eslint 0 新增问题（仅余 4 个既有 import/first 错误，git diff 证实非本次引入）✅、build:weapp 成功 ✅、dist 确认含 onKeyboardHeightChange 与 unknown_mix ✅、graphify 已更新 ✅；双 Agent 审查通过（P0/P1=0，详见下）；改动未提交。
- **双 Agent 审查结论**：**通过**。审查发现并已修复：①P2 关键词缺口——除「不确定/混血/串串/不知道/mix/unknown」外补「流浪/土狗/土猫/田园/领养」到 `isUnknownBreedKeyword`（否则用户搜「流浪」时兜底行不显示、空态提示也无兜底，正好卡住目标用户）+ 补单测；②P3 edit 页选「不确定品种」补 `trackEvent('select_breed_unknown')` 与 add 页口径一致；③P3 服务端 `petPrompt.ts` 的 `petSubjectText` 把「不确定品种/混血/串串」映射为 `PET_BREED_FALLBACK`（防文生图把「不确定」当指令词，与「烧鸡」同类风险的低危版）+ 补 4 断言。P2 真机验证（键盘抬升方案安卓/iOS 实测）为待办非缺陷。
- **遗留建议**：edit 页品种 Picker 与 add 页搜索面板交互不一致（后续可统一为搜索面板）；breed-detail「我的宠物是这个品种」跳转 edit 页的 breedId/breedName/species 参数 edit 页未消费（既有问题，本次未动）；键盘高度方案需真机验证（模拟器/安卓/iOS）。

### 2026-08-24 · 添加宠物"拍照识别品种"（AI 帮用户认品种，用户需求正解）

- **需求澄清**：用户真正想要的是"**怎么帮助宠物判断品种**"（识别），不是只给一个"不确定品种"兜底选项。项目里品种百科页本就有 AI 拍照识别（后端 `/api/ai/breed-recognize`，authMiddleware + 全局限流，已上线），只是添加宠物时没有入口。
- **实现（纯前端 2 文件 + 1 新测试）**：`pagesPet/add/index.tsx` 品种面板顶部新增「📷 拍照识别品种」入口（搜索框上方、主色渐变卡片）——点击 → 未登录先 `ensureLoggedIn` 引导（识别接口需登录）→ `chooseImageWithPrivacy` 拍照/相册 → `recognizeBreed`（复用 breedService，识别失败/取消不打扰流程）→ `matchBreedInData` 在品种库三级匹配 → 面板内展示识别结果卡：匹配到库内品种 → 「✅ 就用这个」复用 `handleSelectBreed` 一键选中（含**物种联动**：识别物种与表单不符时自动切换并清空旧品种，照片是权威）；未收录 → 「按识别名填写」（breedId=unknown_mix、breedName=识别名，展示可读/功能走默认）或「选不确定品种」；识别中面板内遮罩防误触（spinner，复用品种百科页视觉语言）；重新打开面板重置识别结果；埋点 breed_recognize_start/success（source: add_pet）+ select_breed_recognized_unmatched。`add/index.scss` 新增识别入口/结果卡/遮罩样式。新增 `services/__tests__/breedService.test.ts` 5 用例（名称/别名/包含匹配、物种过滤、空输入）——此前 matchBreedInData 无任何测试。
- **验证**：typecheck 0 错误 ✅、全量 2376 passed / 0 failed（含新增 5 个）✅、eslint 0 新增问题 ✅、build:weapp 成功 ✅、dist 确认含 breed-recognize（breedService 在 sub-vendors 共享 chunk）✅、graphify 已更新 ✅；双 Agent 审查通过（P0=0，P1×2/P2×3 全部修复，见下）；改动未提交。
- **交互闭环**：不知道品种 → 拍照识别 → 一键选中（物种自动联动）→ 识别不出 → 不确定品种兜底 → 面板键盘抬升始终可见。与品种百科页识别共用同一接口与匹配逻辑。
- **双 Agent 审查结论**：**需修改 → 已全部修复**。①P1-1 后端 `/breed-recognize` 原只有全局限流（120/分），每次=1 次付费视觉 LLM → 新增 `aiRecognizeLimiter`（5 次/分，rateLimit.ts + ai.ts 挂载）；②P1-2 识别期间遮罩外 overlay 仍可关面板（付费请求发出但结果静默丢弃）→ `handleCloseBreedPanel` 加 `isRecognizing` 守卫；③P2-1 选图阶段防连点依赖平台失败不可靠 → `recognizingRef` 同步 ref 防连点（setIsRecognizing 提前到选图前）；④P2-2 AI 识别名自由文本落库无长度上限 → `createPetSchema.breed` 补 `.max(50)`；⑤P2-3 breedService 401/非 JSON 响应误提示"照片不清晰"→ 区分登录过期/服务异常文案。服务端 tsc + 938 测试全绿、小程序 tsc + 2376 测试全绿、build 成功。
- **遗留建议**：「按识别名填写」的 breedName 是 AI 自由文本，喂 AI 对话/生图时注意清洗（petPrompt 已兜底"不确定品种/混血/串串"）；识别入口与品种百科页共用接口，滥用面由 aiRecognizeLimiter 统一兜住。

### 2026-08-24 · 全家福生图参考图分级 + 默认头像去品种名（已提交已部署）

- **需求（用户）**：①全家福生图要分级——参考图必须是"真实形象"（用户上传的真实照片 avatar_photo_url / 基于真实照片生成的 AI 形象 avatar_cartoon_url），只有品牌默认头像（home-style 预设/兜底图）或没头像的成员，要先引导用户去生成真实形象，不能硬生成；②小猫默认头像不要标品种名字（那只是默认头像）。
- **根因**：全家福 `collectMemberPhotos` 用 `COALESCE(avatar_photo_url, avatar_cartoon_url)` 取参考图，不区分真实/默认——形象定制页"预设形象"保存时把品牌头像（本地 preset-home 资源）写进 avatar_cartoon_url，全家福会拿默认头像当参考图（生成的是默认卡通图而非真实小猫）；且 `avatar_style` 无法区分预设/文字生成/照片生成（都是画风 key，styleVariant 未落服务端）。
- **修复（后端权威分级 + 前端引导）**：①`familyPhotoService.ts` 新增 `isBrandPresetUrl`（URL 含 `/home-style/` 或 `/preset-home/` 判定为品牌默认头像）；`collectMemberPhotos` 分级过滤（photoUrl 只留真实形象，品牌 URL 置 null + `hasRealImage` 标记）；`generateFamilyPhoto` 校验：有成员无真实形象 → 400 + `code:'MEMBER_NO_REAL_IMAGE'` + `missingMembers`（不调用 Seedream 不浪费配额）；②`routes/familyPhotos.ts` 失败响应透传 code/missingMembers；③前端链路打通：`api.ts` 把 code/missingMembers 挂到 Error → `familyStore.generateAiPhoto` catch 透传 → `dashboard` 识别 MEMBER_NO_REAL_IMAGE 弹窗"去生成形象"（先 `switchPet` 切到缺形象宠物再 navigateTo avatar-customize，**不降级 Canvas**）；④预设形象卡 label 由品种名改为"预设 N"；⑤顺带修**「保存到相册」必失败既有 bug**：store 默认 `photoType='generated'` 与后端 schema（仅 canvas_fallback|uploaded）冲突 → 默认改 `canvas_fallback` + PhotoType 类型/mockApi 同步。
- **验证**：服务端 tsc 0 + 全量 938 passed（新增 isBrandPresetUrl 4 例 + 分级集成 2 例）；前端 tsc 0 + 全量 2371 passed + build:weapp ✅ + eslint 无新增；双 Agent 审查通过（P0=0，P1=2 已处理其一，见遗留）；graphify 已更新。
- **提交**：`e53ca17 feat(全家福): 生图参考图分级校验，无真实形象引导生成形象`（7 文件 +167/-9，分支 develop）。⚠️ 混改文件未提交：`familyStore.ts`/`familyService.ts`/`familyTypes.ts`/`mock.ts` 含本次改动（generateAiPhoto 透传、savePhoto 修复）与"家庭图谱人关系"未提交改动混在同一文件，留在工作区；`petPrompt.ts` 含并行会话"不确定品种"改动。
- **部署（已完成，无数据库迁移）**：上传 familyPhotoService.ts + familyPhotos.ts → 备份 `/opt/xinghuanhai/src.bak.photograde-*` → PM2 重启 → 冒烟全绿（health 200、日志无 error、生产实测 isBrandPresetUrl 品牌 true/真实 false + buildPrompt 回归）；部署记录已更新；回滚=恢复 src.bak.photograde-* 后重启。
- **遗留（用户已确认口径 2026-08-24）**：**真实形象 = 照片上传（avatar_photo_url）或 照片生成的专属形象（avatar_cartoon_url 且来源为照片生成）**；文字描述生成的 AI 形象不算真实形象。当前实现"非品牌 URL 即真实"会放行文字生成形象 → **下一轮实现严格化**：pet_profiles 加 `avatar_source` 列（text|photo|preset，迁移 028）或复用 avatar_generations 来源，前端保存形象时写入来源标记，collectMemberPhotos 按 avatar_source 判定。**待办（用户侧）**：微信开发者工具重新编译小程序（前端改动：dashboard 引导、预设卡去品种名、savePhoto 修复）→ 重新生成全家福。

### 2026-08-24 · 形象定制"文字描述生成"补输入框并接入生图（已提交 6966e99 已部署）

- **现象（用户）**：①形象生成为什么无法生成（免费用户文字生成为会员专享，页面只显示会员引导卡，且用户不知道免费路径）；②"文字描述生成"没有地方输入文字（确认 UI 缺失——Tab 名不副实，生成全程用宠物档案自动拼提示词，无用户描述参与）；③提示生成了但看不到在哪（候选列表"选择你喜欢的形象"在生成面板最底部，需滚动才可见，生成后无自动定位）。
- **修复**：①服务端 `avatarService.generatePetImageOptions` 新增 `description` 参数（清洗换行/截断 100 字后拼进各画风提示词：`${petSubjectText(...)}的头像，${用户描述}，...`）+ `routes/avatar.ts` generate-options 接收透传（生成记录 prompt 含描述）；②前端 `avatar-customize` 文字生成 Tab 新增描述 Textarea（placeholder 引导如"橘色英短，圆脸胖乎乎的"+ "只写外貌特征，不要写宠物名字"防「烧鸡」风险），`handleTextGenerate` 传描述；③生成成功后 `Taro.pageScrollTo` 滚动到候选列表（"生成成功，请选择喜欢的形象"后用户一眼看到 5 选 1）；④免费用户会员引导卡文案补免费路径提示（预设形象 / 照片生成 Tab 上传照片作头像）；⑤测试：后端新建 `avatarService.test.ts` 3 用例（描述拼提示词+清洗、无描述回退档案、全失败 null）+ 前端 `avatarService.test.ts` 3 用例（描述透传、无描述 undefined、失败 null）。
- **验证**：后端 tsc 0 + 全量 941 passed（新增 3）；前端 tsc 0 + 全量 2379 passed（新增 3）+ build:weapp ✅；graphify 待更新。
- **提交**：`6966e99 feat(形象): 文字描述生成补输入框并接入生图，候选结果自动定位`（7 文件 +187/-9，分支 develop）。
- **部署（已完成，无数据库迁移）**：上传 avatarService.ts + routes/avatar.ts → 备份 `/opt/xinghuanhai/src.bak.avatardesc-*` → PM2 重启 → 冒烟 health 200、进程 online、文件校验通过；回滚=恢复 src.bak.avatardesc-* 后重启。
- **待办（用户侧）**：微信开发者工具重新编译小程序后体验（AI 文字/照片生成均需会员；免费用户可走预设形象或照片 Tab 上传照片作头像）。

### 2026-08-24 · 形象定制页重构 + 形象库（已提交 4c19fe0 已部署，含迁移 028）

- **需求（用户）**：①删除页面冗余的"风格切换/表情系统"展示卡；②文字生成时让用户手动选择画风+表情，给参考提示词模板指引；③做"形象库"保存多次生成的形象，按风格/表情分类管理（用户确认：生成 1 张、服务端存储、12 种表情）。
- **实现**：①迁移 028 `pet_avatar_library`（**审查 P0：user_id 必须 UUID 对齐 users.id，TEXT 建外键必失败**——本地 PG18 实证；UNIQUE(pet_id,image_url) 防重复收藏）；②服务端 `generatePetImageOptions` 支持 `styleKey`（单画风生成 1 张）+ `expression`（`EXPRESSION_PROMPTS` 12 表情中文提示词）；generate-options 接收 styleKey/expression（白名单校验）+ **文字/照片配额口径拆分**（文字 style=`options-*-text-*` 不计入照片 3 次/月，`countMonthlyOptionsByUser` 排除 `%-text-%`）；新增 `/library` 三接口（POST 保存 / GET 查询 / DELETE 删除：宠物归属 `findByIdAndUser` + style 白名单 + imageUrl http(s) + expression 白名单）；③前端：删冗余卡；文字 Tab = 描述 + 参考模板 + 画风单选 + 表情单选 + 生成 1 张；结果区单张（存入形象库 / 设为当前 / 重新生成）；形象库卡（画风/表情筛选、点击设为当前、删除二次确认）；照片 5 候选补"存入形象库"；**`getAvatarLibrary` snake→camel 映射**（审查 P0：否则 imageUrl undefined → 图片空白 + 设为当前传 undefined 清空照片）；清理死样式/死代码/过时文案；④测试：服务端 avatarService.test.ts 6 例 + avatar.library.test.ts 10 例、前端 avatarService.test.ts 27 例。
- **验证**：后端 tsc 0 + 全量 954 passed；前端 tsc 0 + 全量 2385 passed + build:weapp ✅ + eslint 0 error；**双 Agent 审查：2 P0（迁移外键/字段契约）+ 3 P1（expression 白名单/配额口径/照片候选存库入口）全部修复**；graphify 已更新。
- **提交**：`4c19fe0 feat(形象): 形象库分类保存 + 文字生成选画风/表情生成单张`（10 文件 +1083/-362，分支 develop）。
- **部署（已完成，含迁移 028）**：迁移 028 建表成功（user_id uuid、索引、owner 移交 xinghuanhai）→ 备份 `/opt/xinghuanhai/src.bak.avatarlib-*` → 替换 3 文件（avatarRepository/avatarService/routes avatar）→ PM2 重启 → 冒烟 health 200、日志无 error、表行数 0；回滚=恢复 src.bak.avatarlib-* 后重启（表可留着）。
- **遗留**：①**avatar_source 严格化**（文字生成形象设当前后会被全家福当"真实形象"参考图，与已确认口径"文字生成不算真实形象"冲突——建议 028 下轮加 source 列或统一 avatar_source 迁移）；②形象库存的是 Seedream CDN 临时 URL（长期有效性问题待评估）；③归属口径：/library 与 generate-options 用 findByIdAndUser（仅主人），photo/upload 用 canAccess（家庭成员可用）——形象库对共管成员不可用（产品可接受则补注释）。**待办（用户侧）**：微信开发者工具重新编译小程序体验。

### 2026-08-24 · 画风扩展至 15 种 + 参考提示词模板公式化（已提交 e8c41b8 已部署）

- **反馈（用户）**：①画风应该不止这一点（提示词库有哪些）；②提示词参考模板太简约（对比视频生成提示词的复杂度）。
- **实现**：①服务端 `AVATAR_STYLE_OPTIONS` 5 → **15 种**（新增吉卜力/皮克斯3D/像素/水墨/油画/赛博朋克/极简北欧/低多边形/线稿/暗黑奇幻 10 种，每风格猫/狗描述融合《宠物回忆录-提示词库.md》§6/§7.1 风格关键词；VHS 复古/故障艺术对宠物头像效果难保证暂不收，需要可再加）；新增 `DEFAULT_STYLE_KEYS`（默认 5 画风池——照片生成等批量候选仍 5 张不放大成本，15 种只用于文字生成单画风选择）；②前端画风 chips 15 种 + 参考模板改为**提示词库式公式**：五字段说明（主体/外貌/表情/画风/氛围）+ 实时完整示例（拼接宠物品种+描述+表情提示词+画风关键词+`GEN_STYLE_ATMOS` 每画风光影氛围词+画质词）+ 「填入外貌+表情」一键按钮。
- **验证**：后端 954 + 前端 2385 测试全绿、tsc 双 0、build:weapp ✅。
- **提交**：`e8c41b8 feat(形象): 画风扩展至15种对齐提示词库，参考模板公式化引导`（3 文件 +170/-7，分支 develop）。
- **部署（已完成，无数据库迁移）**：上传 avatarService.ts（备份 `/opt/xinghuanhai/src.bak.styles15-*`）→ PM2 重启 → 冒烟 health 200、日志无 error。
- **待办（用户侧）**：微信开发者工具重新编译小程序体验（文字生成可选 15 种画风）。

### 2026-08-24 · 照片自动提取详细外貌进生图提示词（已提交 5758bcf 已部署）

- **反馈（用户）**："提示词描写怎么不详细，怎么就用橘色虎斑草草描述"——提示词库 §0.9 明确要求"每一个细节都描写，具体到眼神、身体动作"（§0.6 范例粒度：`成年金毛，金黄色卷毛，胸口白色斑块，戴红色皮质项圈+铜铃铛`）。
- **根因**：生图提示词的外貌信息只来自宠物档案品种 + 用户可选描述——档案里没有毛色/花纹等细节数据，用户不写就没有具体样貌。
- **实现**：①服务端 `extractPetAppearance`（复用 `visionService.analyzeImage` 的 DeepSeek 视觉模型，prompt 强制输出毛色/花纹/体型/脸型/眼睛颜色/鼻子/胡须/特殊标记，清洗去换行/截断 100 字）；`generate-options` 集成：**用户未写描述且宠物有真实照片（avatar_photo_url）时自动提取外貌**拼进提示词——只"读照片描述外貌"，不传参考图、不触发照片生成的会员配额（文字生成口径不变），提取失败降级档案描述；②前端：输入框 placeholder 改为详细示范（橘色虎斑英短，橙底深棕条纹，额头M纹，圆脸，琥珀色大眼睛，粉色鼻头，白色下巴胸毛）、公式区"外貌"字段多维引导、模板示例 fallback 详细化、提示"有真实照片留空自动提取"；③测试：`extractPetAppearance` 3 例（提取清洗/null 降级/抛错）+ 路由自动提取 4 例（有照片提取/用户描述优先/无照片跳过/提取失败降级）。
- **验证**：后端 961 + 前端 2385 测试全绿、tsc 双 0、build:weapp ✅。
- **提交**：`5758bcf feat(形象): 照片自动提取详细外貌进生图提示词，模板示例细节化`（5 文件 +144/-14，分支 develop）。
- **部署（已完成，无数据库迁移）**：上传 avatarService.ts + routes/avatar.ts（备份 `/opt/xinghuanhai/src.bak.appearance-*`）→ PM2 重启 → 冒烟 health 200、日志无 error。
- **待办（用户侧）**：微信开发者工具重新编译小程序体验（有真实照片时描述留空，系统自动提取毛色花纹等详细外貌进提示词）。
