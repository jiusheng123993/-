# 星河宠记 · API 文档

> **文档版本：2026-09-08 基于代码全量重写**。全项目双 Agent 审查发现旧版前 643 行为早期生成的虚构内容（register/alipay 等查无路由、Base URL 误写 3001），已整体废弃。本文档由 37 个路由文件 + `index.ts` 挂载 + `schemas/index.ts` 校验 + `middleware/rateLimit.ts` 逐一对齐得出，**以代码为准**。

## 一、通用约定

- **Base URL**
  - 开发：`http://localhost:3000`
  - 生产：`https://api.xinghuanhai.com`
- **鉴权**：`Authorization: Bearer <JWT>`（`/api/auth/login` 换取；JWT_SECRET ≥32 字符，启动强校验）
- **统一响应包裹**：`{ "success": true, "data": ..., "message?: string }`；业务错误码挂 `code` 字段（如 `MEMBER_ONLY`、`MEMBER_NO_REAL_IMAGE`、`PHOTO_QUOTA_EXCEEDED`）
- **限流总表**（express-rate-limit，IP+用户双维度，全局限流覆盖所有 `/api/*`）：

| 限流器 | 档位 | 覆盖接口 |
| --- | --- | --- |
| globalLimiter | 120 次/分 | 全部 /api/*（兜底） |
| aiGenerateLimiter | 5 次/分 | 形象生成类 + 全家福生成 |
| generateLimiter（avatar 本地） | 5 次/分 | /api/avatar/generate |
| chatLimiter | 30 次/分 | /api/ai/chat、/api/agent/chat |
| memoirLimiter | 3 次/分 | POST /api/pets/:petId/memoir |
| uploadLimiter | 10 次/分 | /api/ai/voice、/api/timeline/photo/upload |
| photoUploadLimiter（本地） | 10 次/分 | /api/naming/photo/upload |
| aiRecognizeLimiter | 5 次/分 | /api/ai/breed-recognize、/api/ai/health-report-recognize |

- **管理后台鉴权**：`/admin/*` 业务接口走 `ADMIN_TOKEN` 头校验（adminAuth）；静态管理页挂 `/admin`。
- **WebSocket**：`wss://<host>/ws?token=<JWT>`（JWT 鉴权，频道按宠物归属隔离）。

## 二、认证 `/api/auth`

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | /login | 公开 | 微信登录（code 换 JWT）；生产缺微信配置返回 503；开发环境 code 即 openid（仅限非生产） |
| POST | /login/phone | 公开 | 手机号验证码登录；**生产环境 403 关闭**（短信服务商未接入） |
| POST | /send-sms | 公开 | 发送验证码；**生产环境 403 关闭**；开发环境返回 devCode |
| POST | /bind-phone | 登录 | 绑定手机号（微信 getPhoneNumber；开发降级 code 即手机号，生产缺配置 503） |
| GET | /profile | 登录 | 当前用户资料 |
| PUT | /profile | 登录 | 更新昵称/头像等 |
| POST | /avatar | 登录 | 上传用户头像（返回 /uploads 相对路径） |

## 三、宠物档案 `/api/pets`（pets.ts）

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | / | 登录 | 创建宠物档案（品种必填，支持 unknown_mix 不确定品种） |
| GET | / | 登录 | 我的宠物列表（含家庭成员共享宠） |
| GET | /:id | 登录 | 宠物详情（canAccess 归属校验） |
| PUT | /:id | 登录 | 更新档案（含 avatar_photo_url/avatar_cartoon_url/avatar_multiview_url） |
| DELETE | /:id | 登录 | 删除档案 |
| POST | /:id/deceased | 登录 | 标记离世（触发纪念线） |
| GET | /:id/facts | 登录 | 宠物事实摘要（记忆引擎） |

## 四、健康数据 `/api/pets`（多文件，全部需登录，宠物归属校验）

| 文件 | 端点 |
| --- | --- |
| checkins | POST /:petId/checkins（打卡，risk_level 枚举 low/medium/high/emergency + legacy 别名）；GET /:petId/checkins（历史，startDate/endDate）；GET /:petId/checkins/today |
| symptoms | POST /:petId/symptom-check（症状初筛）；GET /:petId/symptom-check/history；POST /:petId/symptom-check/ai-analysis（会员 AI 深度分析） |
| vaccines | GET/POST /:petId/vaccines；PUT /:petId/vaccines/:vaccineId/complete；PUT /:petId/vaccines/:vaccineId/reminder |
| chronic | POST/GET /:petId/chronic；PUT/DELETE /:petId/chronic/:recordId；POST /:petId/chronic/ai-analysis；POST /:petId/chronic/scan-risk |
| feedingRecords | POST/GET /:petId/feeding-records；PUT/DELETE /:petId/feeding-records/:recordId；POST /:petId/feeding-records/ai-analysis |
| suggestionRecords | POST/GET /:petId/suggestions；PATCH /:petId/suggestions/:recordId/adoption；DELETE /:petId/suggestions/:recordId |
| trends | GET /:petId/trends（趋势点，startDate/endDate）；GET /:petId/trends/report（月报） |
| yearlyReview | POST /:petId/yearly-review（创建年度报告草稿）；GET /:petId/yearly-review/list；GET /:petId/yearly-review/:year；PUT /:petId/yearly-review/:reviewId（编辑含封面）；POST /:petId/yearly-review/:reviewId/generate-video（付费生成，Seedance） |

## 五、家庭 `/api/families`

**families.ts**（读=成员，写删=owner）：POST /（创建）、GET /（我的家庭列表）、GET/PUT/DELETE /:id、POST /:id/members（加宠）、DELETE /:id/members/:petId、DELETE /:id/members/by-id/:memberId、PATCH /:id/members/:memberId/role（角色管理）、GET /:id/moments、GET /:id/moments/new、POST /:id/invites（生成家庭邀请）、POST /join（凭码加入）、GET /:id/users（人成员）、DELETE /:id/users/:userId、GET/POST /:id/user-relations（人关系：couple/father_daughter 等 8 种）、DELETE /:id/user-relations/:relationId。

**feeds.ts**：GET /:id/feeds/highlight、GET /:id/feeds、POST /:id/feeds（发动态）、PUT/DELETE /:id/feeds/:feedId。

**weeklyReports.ts**：GET /:id/weekly-reports/latest、POST /:id/weekly-reports/generate、GET /:id/weekly-reports、GET /:id/weekly-reports/:reportId（返回表行结构 report_data JSONB，前端 mapBackendReportRowToView 映射）。

**familyTree.ts**：GET /:id/overview（家庭总览图谱）、GET /:id/tree、POST /:id/tree/snapshot、GET /:id/tree/snapshots、POST /:id/relationships（宠物关系）、PUT/DELETE /:id/relationships/:relId、POST /:id/lineage（血缘）、GET /:id/lineage/:petId、DELETE /:id/lineage/:lineageId。

**leaderboard.ts**：GET/POST /:id/roles、DELETE /:id/roles/:roleId（家庭角色分工）。

**familyPhotos.ts**（AI 全家福，owner）：POST /:familyId/photos（生成，aiGenerateLimiter 5/分，scene 22 选+customScene+memberOrder 排位）、GET /:familyId/photos、DELETE /:familyId/photos/:photoId、POST /:familyId/photos/upload。生成校验「真实形象」分级（MEMBER_NO_REAL_IMAGE 引导）。

## 六、AI `/api/ai` + Agent `/api/agent`

| 方法 | 路径 | 限流 | 说明 |
| --- | --- | --- | --- |
| POST | /api/ai/chat | chatLimiter 30/分 | AI 对话（messages ≤20 条×4000 字，max_tokens ≤4096） |
| POST | /api/agent/chat | chatLimiter 30/分 | Agent 对话（工具调用链，成本落 agent_conversation_logs） |
| GET | /api/agent/history | 登录 | 会话历史 |
| GET | /api/agent/tools | 登录 | 工具清单 |
| POST | /api/ai/guard | 登录 | 输入安全守卫 |
| POST | /api/ai/guard/output | 登录 | 输出安全守卫 |
| POST | /api/ai/naming/interpret | namingLimiter 10/分 | 名字解读 |
| POST | /api/ai/naming/recommend | namingLimiter 10/分 | AI 起名推荐 |
| POST | /api/ai/voice | uploadLimiter 10/分 | 语音识别（音频上传） |
| POST | /api/ai/breed-recognize | aiRecognizeLimiter 5/分 | 拍照识别品种（视觉 LLM） |
| POST | /api/ai/health-report-recognize | aiRecognizeLimiter 5/分 | 体检报告识别 |

## 七、形象生成 `/api/avatar`

| 方法 | 路径 | 限流 | 说明 |
| --- | --- | --- | --- |
| POST | /generate | 5/分+月配额 | 旧单图生成（会员；照片月度 3 次封顶 PHOTO_QUOTA_EXCEEDED） |
| POST | /generate-options | 5/分 | 一套两张候选生成（文字流/照片流；description/styleKey/expression/background 可选；照片月配额与 /generate 共享） |
| POST | /background-swap | 5/分 | 真·背景替换（图生图保角色；8 预设+customBackground） |
| POST | /library | 登录 | 存入形象库（viewType: headshot/multiview） |
| GET | /library | 登录 | 形象库列表（style/expression/viewType 筛选） |
| DELETE | /library/:id | 登录 | 删除形象库条目 |
| POST | /photo/upload | 登录 | 上传宠物照片（uuid+归属校验+扩展名白名单） |
| POST | /generate-2d | 5/分 | 2D 形象包 |
| GET | /task/:taskId | 登录 | 2D 任务轮询 |
| POST | /generate-3d | 5/分 | 3D 模型生成 |
| GET | /images/:petId | 登录 | 2D 图片列表 |
| GET | /model/:petId | 登录 | 3D 模型地址 |
| GET | /quota | 登录 | 生成配额查询 |

## 八、回忆录 `/api/pets`（memoir.ts）

| 方法 | 路径 | 限流 | 说明 |
| --- | --- | --- | --- |
| POST | /:petId/memoir | memoirLimiter 3/分 | 创建回忆录任务（source_photos 仅本站 uploads 白名单，SSRF 防护；daily 1-3 张/memorial 8-15 张；非会员返回 need_payment+订单） |
| POST | /:petId/memoir/preview | 登录 | 剧本预览（LLM 分镜） |
| GET | /:petId/memoir/status | 登录 | 当前任务状态 |
| GET | /:petId/memoir/list | 登录 | 回忆录列表 |
| DELETE | /:petId/memoir/:memoirId | 登录 | 删除 |
| GET | /:petId/membership | 登录 | 回忆录会员权益查询 |

## 九、支付与会员

**payment.ts `/api/payment`**：POST /memoir/order（创建回忆录支付订单，含 source_photos 白名单校验）、POST /membership/order（创建会员订单）、POST /wechat/notify（**公开**，微信支付回调，raw body 验签；生产禁止 Mock——WECHAT_PAY_MOCK=false 强制）、GET /orders/:orderId（查自己的订单，归属校验）。资金动作全部落 audit_log（payment-paid/payment-refunded/membership-activated/memoir-created）。会员续费顺延：expires_at = max(当前到期, now) + 时长。

**membership.ts `/api/membership`**：GET /status、POST /subscribe、POST /cancel、GET /usage（配额使用）。

**redeem.ts `/api`**：POST /redeem（登录，兑换码核销，顺延口径；审计 redeem-used）、POST /admin/redeem-codes（adminAuth，生成）、GET /admin/redeem-codes（adminAuth，列表）。

## 十、其他业务

| 域 | 端点 |
| --- | --- |
| 时光线 /api/timeline | POST /moments（发回忆）、GET /moments（familyId 可选）、DELETE /moments/:id、POST /ai-describe、POST /ai-polish、POST /photo/upload（uploadLimiter+扩展名白名单）、GET /last-year |
| 分享卡 /api/share-cards | POST /generate、GET /、GET /:id、DELETE /:id、POST /:id/share |
| 记忆 /api/memory | GET /（健康记忆列表）、PUT /:id |
| 食物 /api/food | GET /query、GET /history、GET /stats、GET /today-count |
| 知识图谱 /api | GET /knowledge/latest、POST /knowledge/feedback；admin：GET/PUT /admin/knowledge、GET /admin/feedback、POST /admin/feedback/:id/review（adminAuth） |
| 品种 /api | GET /breeds/knowledge；admin：GET/PUT /admin/breeds（adminAuth） |
| 反馈 /api/feedback | POST /nps、GET /my |
| 统计 /api/analytics | POST /events（**当前无鉴权，userId 客户端自报**——审查 P2 在案） |
| 邀请裂变 /api | GET /invite-code、POST /shares（记录分享）、GET /referrals、POST /referrals/process（invitee 一律取登录态，2026-09 P0 修复）、POST /shares/grant-reward（邀请满 3 人奖 7 天会员） |
| 健康 | GET /api/health（公开探针） |

## 十一、静态资源

- `/uploads/**`：Express 托管上传目录（nginx 对 jpg/png 等静态资源优先、uploads 回退后端）。
- `/admin`：管理后台静态页（adminAuth 保护业务接口，页面本身路径可枚举——P2 在案）。

## 十二、与旧版（虚构版）差异

1. Base URL 3001 → **3000**（PORT=3000）。
2. 删除不存在的接口描述：`/api/auth/register`、任何 alipay 相关接口、`token refresh`、`session`、`bind-device`、`devices` 等——代码中查无此路由。
3. 新增旧版遗漏的真实接口域：回忆录（memoir/preview/payment 链）、形象生成（generate-options/library/background-swap/2D/3D）、全家福（scene/memberOrder）、Agent、知识图谱热更新、兑换码、邀请裂变、年度报告、分享卡等。
4. refreshToken：服务端不下发；小程序端 storage 中的 refreshToken 为僵尸字段（审查 P1 在案，待清理）。
