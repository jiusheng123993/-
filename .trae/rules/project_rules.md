# 星寰海项目规则

## 项目信息
- 项目名：星寰海 (Xinghuanhai)
- 工作区：e:\星寰海
- Git分支：develop
- 技术栈：React 18 + TypeScript + Vite + Vitest + Express + Electron

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
