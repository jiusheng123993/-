# 星寰海项目规则

## 项目信息
- 项目名：星寰海 (Xinghuanhai)
- 工作区：e:\星寰海
- Git分支：develop
- 技术栈：React 18 + TypeScript + Vite + Vitest + Express + Electron

---

## 🔴 Agent 强制检查清单（每次对话必须执行，禁止跳过）

> **此清单优先级最高。Agent 在每次对话中必须逐项执行，不得以"忘了"、"不需要"等理由跳过。**

### 对话开始时
- [ ] **CodeGraph 索引搜索**：涉及代码定位、影响分析、调用链追踪时，必须先调用 CodeGraph Skill（`Skill: codegraph`）进行语义搜索，不得仅凭猜测或 grep 定位代码
- [ ] **回顾项目记忆**：调用 `mcp_local-project-memory_get_project_brief` 了解项目当前状态和最近交接记录

### 修改代码时
- [ ] **检查禁止修改区域**：确认不涉及 `src/server/`、`src/entitlement/entitlementService.ts`、`src/auth/devAuthSession.ts`
- [ ] **遵循模块边界**：UI 层不直接访问 localStorage，业务逻辑在 service 层
- [ ] **TypeScript 检查**：修改后运行 `npx tsc --noEmit` 确保 0 错误
- [ ] **测试验证**：新增功能必须包含测试，运行 `npm run test` 确保通过

### 任务完成时（必须全部执行）
- [ ] **提醒用户提交代码**：主动询问是否需要 `git commit` 和 `git push`
- [ ] **写入项目记忆**：调用 `mcp_local-project-memory_remember_project_context` 记录本次修改的关键信息（修改了什么、为什么改、影响范围、验证结果）
- [ ] **记录 handoff 交接**：调用 `mcp_local-project-memory_record_handoff_note` 记录任务摘要、变更文件、验证结果、风险、后续步骤

---

## 开发规范

### 代码提交
- 分支：develop（主分支）
- 提交格式：`feat(module): description`
- 禁止直接推送到 main（如存在）

### 测试要求
- 新增功能必须包含测试
- 运行 `npm run test` 确保通过
- 当前状态：需运行确认

### 模块边界
- UI层 → 禁止直接访问 localStorage，通过 hooks/data 层
- 业务逻辑应在 service 层
- 禁止跨层调用

### 禁止修改区域
- `src/server/` - 后端服务
- `src/entitlement/entitlementService.ts` - 权益核心
- `src/auth/devAuthSession.ts` - 认证（开发用）

### UI 规范
- 独立 Sidebar/SidebarToggle 是最新版 UI，必须保留
- 默认主界面保留可拖拽模块画布
- 旧 dashboard/会员中心/主题中心等重内容应折叠或按需加载

## 常用命令
```bash
npm run dev       # 启动开发服务器
npm run test      # 运行测试
npm run lint      # ESLint 检查
npm run build     # 构建
```

## 当前状态
- 测试：运行中（Vitest）
- Lint：PowerShell 执行策略限制，需手动验证
- TypeScript：0 错误（VS Code 诊断确认）

## 项目记忆
- 项目已初始化 CodeGraph 索引（257 文件，2980 节点）
- 当前任务：UI 全面换血为画布工作台（进行中）
- 禁止修改：src/server/、src/entitlement/entitlementService.ts、src/auth/devAuthSession.ts
