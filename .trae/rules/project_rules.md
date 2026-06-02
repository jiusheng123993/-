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
- 当前状态：881/881 测试通过

### 模块边界
- UI层 → 禁止直接访问 localStorage，通过 hooks/data 层
- 业务逻辑应在 service 层
- 禁止跨层调用

### 禁止修改区域
- `src/server/` - 后端服务
- `src/entitlement/entitlementService.ts` - 权益核心
- `src/auth/devAuthSession.ts` - 认证（开发用）

## 常用命令
```bash
npm run dev       # 启动开发服务器
npm run test      # 运行测试
npm run lint      # ESLint 检查
npm run build     # 构建
```

## 当前状态
- 测试：881/881 通过
- Lint：1 个既有 warning
- TypeScript：0 错误
