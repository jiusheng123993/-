# 星寰海 - 全项目模块重构设计文档

> 版本：v1.0 | 日期：2026-06-07 | 状态：待确认

---

## 一、项目现状分析

### 1.1 现有模块清单（src/ 目录）

| 目录 | 功能 | 状态 | 是否保留 |
|------|------|------|---------|
| sidebar-panel/ | 快捷面板（6个新模块） | ✅ 已完成重构 | ✅ 保留 |
| agent/ | AI Agent 聊天 + 运行时 | ✅ 完整 | ✅ 保留 |
| ai/ | AI Provider 注册 | ✅ 完整 | ✅ 保留 |
| study/ | 学习仪表盘 + 间隔重复 | 🟡 功能完整但 UI 老旧 | 🔄 重做 |
| habits/ | 习惯打卡 | ✅ 完整 | ✅ 保留 |
| schedule/ | 日程管理 | ✅ 完整 | ✅ 保留 |
| quotes/ | 语录收藏 | 🟡 功能简单 | 🔄 重做 |
| wellness/ | 健康管理 | 🟡 功能简单 | 🔄 重做 |
| finance/ | 财务管理 | 🟡 功能简单 | 🔄 重做 |
| watchlist/ | 影视清单 | 🟡 功能简单 | 🔄 重做 |
| english/ | 英语学习 | 🟡 功能简单 | 🔄 重做 |
| mood/ | 心情记录 | 🟡 功能简单 | 🔄 重做 |
| project/ | 项目管理 | 🟡 功能简单 | 🔄 重做 |
| goals/ | 目标追踪 | 🟡 功能简单 | 🔄 重做 |
| journal/ | 日记 | ✅ 完整 | ✅ 保留 |
| reading/ | 阅读追踪 | ✅ 完整 | ✅ 保留 |
| knowledge-graph/ | 知识图谱 | ✅ 完整 | ✅ 保留 |
| backlink/ | 双向链接 | ✅ 完整 | ✅ 保留 |
| focus/ | 专注模式 | ✅ 完整 | ✅ 保留 |
| data/ | 数据层 | ✅ 完整 | ✅ 保留 |
| themes/ | 主题系统 | ✅ 完整 | ✅ 保留 |
| personas/ | 身份系统 | ✅ 完整 | ✅ 保留 |
| components/ | 通用组件 | ✅ 完整 | ✅ 保留 |
| hooks/ | 通用 Hooks | ✅ 完整 | ✅ 保留 |
| notifications/ | 通知系统 | ✅ 完整 | ✅ 保留 |
| creator/ | 创作工坊 | 🟡 功能简单 | 🔄 重做 |
| templates/ | 模板市场 | ✅ 完整 | ✅ 保留 |
| settings/ | 设置 | ✅ 完整 | ✅ 保留 |
| sidebar/ | 侧边栏导航 | ✅ 完整 | ✅ 保留 |

### 1.2 现有 AI 基础设施（可直接复用）

| 能力 | 文件 | 说明 |
|------|------|------|
| 多 Provider 支持 | `ai/aiProvider.ts` | DeepSeek、OpenAI、通义千问、豆包、本地模型 |
| 流式聊天 | `agent/agentRuntime.ts` | `sendAgentChatMessageStream()` 支持 SSE 流式返回 |
| API Key 检测 | `hooks/useApiKeyStatus.ts` | 检测各 Provider 的 Key 是否配置 |
| Prompt 构建 | `ai/aiProvider.ts` | `createAiPromptDraft()` 统一构建 system/user prompt |
| 间隔重复算法 | `study/spacedRepetition.ts` | SM-2 算法，支持质量评分 0-5 |
| 学习数据服务 | `study/studyService.ts` | 目标/任务/笔记/复习项的 CRUD |
| 数据持久化 | `data/localStudyStore.ts` | localStorage 存储，支持内存/浏览器两种 Store |

### 1.3 现有设计系统

| 要素 | 说明 |
|------|------|
| 设计风格 | 柔和高端 (soft premium) |
| CSS 方案 | CSS Modules (.module.css) |
| 主题变量 | `--surface`, `--border`, `--text`, `--muted`, `--font-display` |
| 间距系统 | 12px 基础间距 |
| 卡片风格 | 毛玻璃 + 微渐变 + 柔和阴影 + 16px 圆角 |
| 动效 | cubic-bezier(0.4, 0, 0.2, 1) 弹性曲线 |

---

## 二、新模块体系设计

### 2.1 架构原则

```
┌─────────────────────────────────────────────┐
│              核心通用层（4个模块）              │
│  所有场景共享，始终可用，已完成                   │
│  专注仪表 | 今日脉搏 | 快捷笔记 | 每日一句        │
├─────────────────────────────────────────────┤
│              场景专属层（按身份切换）              │
│  🎓 学生备考  │  💼 职场办公  │  🌱 个人成长  │ ... │
│  错题本       │  日程管理     │  习惯打卡     │     │
│  记忆卡       │  会议记录     │  阅读追踪     │     │
│  考试记录     │  项目看板     │  目标追踪     │     │
│               │  周报生成     │  反思日记     │     │
├─────────────────────────────────────────────┤
│              AI 增强层（贯穿所有模块）            │
│  多 Provider | 流式调用 | API Key 检测          │
└─────────────────────────────────────────────┘
```

### 2.2 核心通用层（已完成，不重做）

| # | 模块 | 模块ID | 功能 | 文件 |
|---|------|--------|------|------|
| 1 | 专注仪表 | side-focus-dashboard | 番茄钟 + SVG 环形进度 + 时长调节 | FocusDashboard.tsx |
| 2 | 今日脉搏 | side-daily-pulse | 今日关键数据聚合 | DailyPulse.tsx |
| 3 | 快捷笔记 | side-quick-notes | 灵感一闪，输入即保存 | QuickNotesModule.tsx |
| 4 | 每日一句 | side-daily-quote | 24条格言 + 收藏 + 刷新 | DailyQuote.tsx |

### 2.3 场景专属层 - 学生备考（本次开发）

#### 模块 1：错题本 (ErrorBook)

**核心功能：**
- 按科目分类记录错题（题目内容、错误答案、科目、标签）
- 错题列表展示，支持筛选科目
- 删除错题

**AI 增强（核心亮点）：**
- 用户粘贴一道错题 → 点击"AI 分析"
- AI 返回三部分：
  1. **错因分析**：指出可能错在哪一步
  2. **正确解法**：给出完整解题过程
  3. **同类题目**：生成 2 道同类型变式题（带答案）
- 结果以卡片形式展示，用户可确认后保存

**技术实现：**
- 数据存储：localStorage key `xinghuanhai-errorbook-state`
- 数据结构：
  ```typescript
  type ErrorItem = {
    id: string
    question: string        // 题目内容
    wrongAnswer: string     // 错误答案
    subject: string         // 科目
    tags: string[]          // 标签（知识点）
    aiAnalysis?: string     // AI 错因分析
    aiSolution?: string     // AI 正确解法
    aiSimilarQuestions?: { question: string; answer: string }[]  // AI 同类题
    createdAt: string
  }
  ```
- AI 调用：复用 `sendAgentChatMessageStream()`，构建专用 system prompt
- 无 API Key 时：显示"配置 API Key 解锁 AI 分析"引导

**UI 设计：**
- 柔和高端风格卡片
- 顶部：科目筛选 tabs
- 中间：错题列表（题目摘要 + 科目标签 + 日期）
- 底部：添加错题表单（题目输入框 + 科目选择 + 添加按钮）
- 点击错题展开：显示 AI 分析结果（错因/解法/同类题）
- 配色：红色调（#ef4444），呼应"错题"主题

---

#### 模块 2：记忆卡 (MemoryCards)

**核心功能：**
- 手动创建知识点卡片（正面：问题/概念，背面：答案/解释）
- 间隔重复复习调度（SM-2 算法）
- 今日待复习列表
- 复习时评分（0-5 分），自动计算下次复习时间

**AI 增强（核心亮点）：**
- 用户粘贴一段课文/笔记内容 → 点击"AI 提取"
- AI 自动提取关键概念，生成多张问答卡片
- 用户预览确认后，一键导入到复习队列

**技术实现：**
- 数据存储：复用现有 `studyService` 的 ReviewItem 数据结构
- 间隔重复：复用现有 `spacedRepetition.ts` 的 `calculateNextReview()`
- AI 调用：复用 `sendAgentChatMessageStream()`
- 无 API Key 时：手动录入卡片，间隔重复正常工作

**UI 设计：**
- 柔和高端风格卡片
- 顶部：统计栏（待复习数 / 已掌握数 / 总卡片数）
- 中间：今日待复习卡片列表（翻转效果或展开查看答案）
- 底部：添加卡片区域（手动输入 or AI 提取）
- 配色：绿色调（#22c55e），呼应"记忆/成长"主题

---

#### 模块 3：考试记录 (ExamTracker)

**核心功能：**
- 记录每次考试/模考的各科分数
- 查看各科分数趋势（简单折线或对比展示）
- 对比最近两次考试的变化

**AI 增强（核心亮点）：**
- 录入两次考试分数后 → 点击"AI 对比"
- AI 分析：
  1. 哪些科目进步了（分数上升）
  2. 哪些科目退步了（分数下降）
  3. 建议优先复习哪个科目

**技术实现：**
- 数据存储：localStorage key `xinghuanhai-examtracker-state`
- 数据结构：
  ```typescript
  type ExamRecord = {
    id: string
    name: string            // 考试名称（如"一模"）
    date: string
    scores: { subject: string; score: number; totalScore: number }[]
    notes?: string          // 复盘笔记
  }
  ```
- AI 调用：复用 `sendAgentChatMessageStream()`
- 无 API Key 时：手动对比分数，显示简单的数值变化

**UI 设计：**
- 柔和高端风格卡片
- 顶部：考试列表（按日期倒序）
- 中间：选中考试的各科分数展示
- 底部：添加考试记录表单
- AI 对比结果以高亮卡片展示
- 配色：蓝色调（#3b82f6），呼应"分析/洞察"主题

---

## 三、AI 落地可行性验证

### 3.1 现有 AI 调用链路

```
用户操作 → 模块组件 → sendAgentChatMessageStream()
  → fetchXFYunCodingCompletionStream() (优先讯飞)
  → fetchChatCompletionStream() (fallback DeepSeek/OpenAI/通义/豆包)
  → SSE 流式返回 → onChunk 回调 → 组件更新 UI
```

### 3.2 每个模块的 AI 调用方式

```typescript
// 错题本 - AI 分析错题
const systemPrompt = `你是备考教练。用户给你一道做错的题目，你需要：
1. 分析可能的错因
2. 给出正确解法
3. 生成2道同类型变式题（带答案）
用 JSON 格式返回：{"analysis":"...","solution":"...","similarQuestions":[{"question":"...","answer":"..."}]}`

// 记忆卡 - AI 提取考点
const systemPrompt = `你是知识提取专家。从用户提供的文本中提取关键知识点，生成复习卡片。
每张卡片包含 front（问题/概念名）和 back（答案/解释）。
用 JSON 格式返回：{"cards":[{"front":"...","back":"..."}]}`

// 考试记录 - AI 对比分析
const systemPrompt = `你是学习分析师。对比用户提供的两次考试分数，指出进步和退步的科目，建议优先复习方向。
用 JSON 格式返回：{"improved":["科目名"],"declined":["科目名"],"priority":"建议优先复习的科目"}`
```

### 3.3 风险与限制

| 风险 | 说明 | 应对 |
|------|------|------|
| API Key 未配置 | 用户没有配置任何 AI Provider 的 Key | 核心功能不依赖 AI，手动录入可用；显示引导提示 |
| AI 返回格式不稳定 | AI 可能不按 JSON 格式返回 | 添加 JSON 解析容错，解析失败时显示原始文本 |
| 网络错误 | API 调用超时或失败 | try-catch + 错误提示 + 重试按钮 |
| 流式响应中断 | 用户关闭页面或网络断开 | AbortController 取消请求 |

---

## 四、开发计划

### 4.1 开发顺序

| 阶段 | 模块 | 预估复杂度 | 依赖 |
|------|------|-----------|------|
| Phase 1 | 错题本 (ErrorBook) | 中 | 无 |
| Phase 2 | 记忆卡 (MemoryCards) | 中 | 复用 studyService + spacedRepetition |
| Phase 3 | 考试记录 (ExamTracker) | 低 | 无 |

### 4.2 每个模块的开发流程

1. 创建数据服务（Service + Store）
2. 创建 UI 组件（TSX + CSS Module）
3. 集成 AI 调用
4. 编写测试
5. 集成到 App.tsx
6. 浏览器验证

### 4.3 文件结构

```
src/
├── error-book/
│   ├── ErrorBookUI.tsx
│   ├── ErrorBookUI.module.css
│   ├── errorBookService.ts
│   └── ErrorBookUI.test.tsx
├── memory-cards/
│   ├── MemoryCardsUI.tsx
│   ├── MemoryCardsUI.module.css
│   ├── memoryCardsService.ts
│   └── MemoryCardsUI.test.tsx
├── exam-tracker/
│   ├── ExamTrackerUI.tsx
│   ├── ExamTrackerUI.module.css
│   ├── examTrackerService.ts
│   └── ExamTrackerUI.test.tsx
```

---

## 五、待确认事项

1. **模块数量**：学生备考场景 3 个模块（错题本 + 记忆卡 + 考试记录），是否合适？
2. **开发顺序**：先做错题本，再做记忆卡，最后考试记录，是否同意？
3. **AI 集成方式**：每个模块内嵌 AI 按钮（非独立聊天窗口），是否同意？
4. **旧模块处理**：现有的 study/、quotes/、wellness/ 等旧模块是否在本次一并删除？