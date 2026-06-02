# 星寰海项目状态（Agent 接手必读）

## 快速开始
1. 读取项目记忆：`get_project_brief`
2. 查看当前状态：读取本文件
3. 查看进度：读取 progress.md

## 项目信息
- 项目名：星寰海
- 工作区：e:\星寰海
- Git分支：develop
- 技术栈：React 18 + TypeScript + Vite + Vitest + Express + Electron

## 当前状态
已完成所有记忆补齐

## 验证状态
- 测试：784/784 通过
- Lint：4 个既有错误（relationship/wallpaper/avatar/cycle）
- TypeScript：38 个既有错误（同上模块）

## 禁止修改
- src/server/ - 后端服务
- src/entitlement/entitlementService.ts - 权益核心
- src/auth/devAuthSession.ts - 认证（开发用）
- 既有错误模块勿轻易修改

## 下一步
待开发 M4 3D 角色生成模块（E12-E16）
