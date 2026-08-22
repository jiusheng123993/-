# 更新日志

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **回忆录 2.0 生成管线**（2026-08-22）
  - AI 分镜脚本生成（DeepSeek，CREST 叙事 + Anti-Subjective 规则，3 次重试 + 兜底模板）
  - Seedance 2.5 十段提示词组装 + Locks 连续性锁（`promptTemplates.ts`）
  - 多角色锚点（多宠物/多人/真人入境：anchors + characters_present，每镜只注入在场角色）
  - 火山豆包语音旁白（SSE 流式，`doubaoSpeechTts.ts`）+ 时间轴拼接（`ttsService.ts`）
  - ASS 中文字幕 + xfade 转场 + 分辨率归一化（`subtitles.ts` + `videoGenerationService.ts`）
  - 全家福静态镜头（ffmpeg zoompan，零 AI 成本零漂移，`static_photo`）
  - DeepSeek 视觉质检（抽帧评分，不合格自动重试，`qualityCheckService.ts`）
  - 管线接入（memoirProcessor 自动分镜 + 质检 + 分镜持久化 jsonb_set）
- **多宠上下文（Agent 认识全家）**（2026-08-22）
  - 家庭宠物列表增强（年龄/性别/已故/最近状态）
  - `find_pet_by_name` 工具 + 查询工具支持 `pet_id` 指定（问"小黑今天怎么样"可查）
- **健康事件自动记忆**（2026-08-22）
  - `recordHealthMemory`：打卡异常/症状初筛自动沉淀健康事件记忆（importance 7-10，当天一条 UPSERT）
- **AI 对话支持关闭思考模式**（2026-08-22，`aiService.ts` ChatOptions.thinking，分镜生成必用）

### Changed
- 回忆录旁白 TTS 从 edge-tts 切换为**火山豆包语音**（云端、SSE 流式、合规）
- 提示词库升级 v5.0（Seedance 2.5 十段 + Locks + 多角色锚点）

### Removed
- **衣橱/换装功能**：因产品范围调整砍掉宠物换装（衣柜饰品 + AI 主题套装），
  同步移除小程序端 wardrobe 页面/组件/数据/资源，以及服务端 `/api/wardrobe` 路由、
  相关服务、仓库与 schema；PRD、设计规格、实施计划与测试路径文档已同步更新。

## [0.1.0] - 2026-06-26
### Added
- **记忆系统**
  - 记忆星图 (MemoryStarMap) - 可视化记忆网络
  - 记忆卡片 (MemoryCards) - 间隔重复学习
  - 认知孪生 (MemoryBody) - 模拟思维模式
  - 知识图谱 (KnowledgeGraph) - 个人知识网络
  - 指标仪表盘 (MetricsDashboard) - 数据可视化

- **专注与学习**
  - 专注模式 (FocusMode) - 沉浸式工作/学习
  - 番茄计时 (FocusTimer) - 时间管理
  - 学习伴侣 (StudyCompanion) - AI 辅助学习
  - 错题本 (ErrorBook) - 智能记录
  - 考试追踪 (ExamTracker) - 备考管理
  - 学习计划 (StudyPlanner) - 计划管理

- **记录与习惯**
  - 日记 (Journal) - 每日记录
  - 快速笔记 (QuickNotes) - 灵感捕捉
  - 习惯追踪 (Habits) - 习惯养成
  - 目标管理 (Goals) - 目标追踪

- **个性化**
  - AI 人格 (Personas) - 自定义助手
  - 虚拟形象 (Avatar) - AI 分身
  - 身份系统 (Identity) - 角色切换
  - 主题系统 (Theme) - 个性化界面

- **健康与关系**
  - 周期追踪 (CycleTracker) - 生理/情绪周期
  - 关系空间 (RelationshipSpace) - 社交管理
  - 健康报告 (Report) - 数据分析

- **基础设施**
  - 后端服务 (Express + WebSocket)
  - 认证系统 (JWT)
  - 支付系统 (微信/支付宝/Apple IAP)
  - 数据同步 (Supabase)
  - CI/CD (GitHub Actions)

### Technical
- React 19 + TypeScript
- Vite 构建
- 26,691 测试用例
- ESLint + TypeScript strict
- 多平台支持 (Web/Electron/Android)

---

## [Unreleased]
### Planned
- [ ] iOS 支持
- [ ] 自动化部署
- [ ] 性能优化
- [ ] PWA 支持
