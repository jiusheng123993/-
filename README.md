# 星寰海 - AI 成长工作台

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version">
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Electron%20%7C%20Android-green" alt="platform">
  <img src="https://img.shields.io/badge/license-MIT-orange" alt="license">
</p>

> 让 AI 成为你的成长伙伴，记住你的一切，陪你一起进化

## 📋 简介

星寰海是一个**个人 AI 成长工作台**，集成多种功能帮助你记录学习、成长、记忆和自我提升。

**核心理念**：让 AI 记住你的一切，陪你一起成长进化。

## ✨ 核心功能

### 🧠 记忆系统
- **记忆星图** - 可视化你的记忆网络
- **记忆卡片** - 间隔重复学习
- **认知孪生** - 模拟你的思维模式
- **知识图谱** - 构建个人知识网络

### 🎯 专注与学习
- **专注模式** - 沉浸式工作/学习
- **番茄计时** - 科学的时间管理
- **学习伴侣** - AI 辅助学习
- **错题本** - 智能记录与复习
- **考试追踪** - 备考管理

### 📝 记录与习惯
- **日记** - 每日记录与反思
- **快速笔记** - 随时捕捉灵感
- **习惯追踪** - 养成好习惯
- **目标管理** - 设定与追踪目标

### 👤 个性化
- **AI 人格** - 自定义 AI 助手性格
- **虚拟形象** - 你的 AI 分身
- **身份系统** - 多重角色切换
- **主题定制** - 个性化界面

### 💪 健康与关系
- **周期追踪** - 生理期/情绪周期
- **关系空间** - 维护重要关系
- **健康报告** - 全面数据分析

### ☁️ 数据同步
- **本地优先** - 数据存在本地，安全隐私
- **云端同步** - 可选 Supabase 同步
- **数据备份** - 导出/导入数据

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 9+

### 安装

```bash
# 克隆项目
git clone https://github.com/jiusheng123993/Xinghuanhai-Growth-Workbench.git
cd Xinghuanhai-Growth-Workbench

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:5173

### 构建

```bash
# Web 构建
pnpm build

# Electron 桌面端
pnpm build:electron:win   # Windows
pnpm build:electron:mac   # macOS
pnpm build:electron:linux # Linux

# Android App
pnpm capacitor:build:android
```

### 测试

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# 代码检查
pnpm lint
pnpm typecheck
```

## 📁 项目结构

```
src/
├── agent/           # AI Agent 对话
├── ai/              # AI 提供商
├── auth/            # 认证系统
├── avatar/          # 虚拟形象
├── components/      # UI 组件
├── data/            # 数据层
├── focus-mode/      # 专注模式
├── focus-timer/     # 番茄计时
├── habits/          # 习惯追踪
├── journal/         # 日记
├── knowledge-graph/ # 知识图谱
├── memory/          # 记忆系统
├── memory-body/     # 认知孪生
├── memory-cards/    # 记忆卡片
├── personas/        # AI 人格
├── relationship/    # 关系空间
├── schedule/        # 日程管理
├── server/          # 后端服务
├── study-*          # 学习工具
└── App.tsx          # 主应用
```

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript
- **构建**: Vite
- **状态**: Zustand
- **样式**: CSS Modules
- **后端**: Express + WebSocket
- **数据库**: Supabase (可选)
- **桌面**: Electron
- **移动**: Capacitor (Android)
- **测试**: Vitest

## 📱 支持平台

| 平台 | 状态 | 说明 |
|------|------|------|
| Web | ✅ 可用 | 浏览器直接访问 |
| Windows | ✅ 可用 | Electron 桌面端 |
| macOS | ✅ 可用 | Electron 桌面端 |
| Linux | ✅ 可用 | Electron 桌面端 |
| Android | ⚠️ 开发中 | Capacitor |

## 🔧 配置

### 环境变量

创建 `.env` 文件：

```env
# Supabase (可选)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key

# AI API (可选)
VITE_OPENAI_API_KEY=your-openai-key
```

### 功能开关

在 `src/memory-body/core/memoryBodyConfig.ts` 中配置认知孪生模块。

## 📄 API 文档

详见 [API.md](./API.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

<p align="center">让每一天都值得</p>