# 星寰海 v2.0 - 微信小程序

> 情绪健康管理平台 — 三道防线：事前干预 → 事后急救 → 主动陪伴

## 技术栈

- Taro 3 + React 19 + TypeScript
- Zustand（状态管理）
- Sass（样式）
- Supabase（后端BaaS，待配置）

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（微信小程序）
npm run dev:weapp

# 构建生产版本
npm run build:weapp

# Lint检查
npm run lint

# TypeScript类型检查
npm run typecheck
```

## 项目结构

```
src/
├── pages/          # 页面（7个模块）
│   ├── index/      # 首页（"你怎么了？"入口）
│   ├── emergency/  # 情绪急救流程
│   ├── login/      # 登录页
│   ├── profile/    # 个人中心
│   ├── calendar/   # 情绪风险日历
│   ├── mood/       # 情绪记录
│   └── treehole/   # 深夜树洞
├── components/     # 通用组件
├── engines/        # 核心引擎
│   ├── emergency/  # 急救引擎
│   └── outreach/   # AI主动推送引擎
├── memory-body/    # 记忆引擎（数据层）
├── hooks/          # React Hooks
├── stores/         # Zustand状态管理
├── services/       # API服务层
├── data/           # 静态数据
└── utils/          # 工具函数
```

## 环境配置

1. 在 `src/services/api.ts` 中配置 Supabase 项目 URL 和 anon key
2. 在微信开发者工具中导入 `miniapp` 目录
3. AppID 需要在 `project.config.json` 中配置
