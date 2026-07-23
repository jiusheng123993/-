# 星寰海小程序 - 项目规则

> 本文件为小程序项目特定规则。全局规则已在主项目 `.trae/rules/` 中定义，Agent 必须同时遵守。

## 1. 开发环境

- Node.js >= 18, <= 22（v24 不兼容 Taro 3.6，如需升级请升级 Taro 到 4.x）
- Taro CLI >= 3.6
- 微信开发者工具（用于预览和调试）

## 2. 代码规范

### TypeScript
- 严格模式（strict: true）
- 路径别名：`@/*` → `src/*`
- 禁止 any（除非明确标注原因）

### React
- 函数组件 + Hooks
- Zustand 状态管理
- Sass 样式（BEM命名）

### 提交规范
```
feat(scope): description
fix(scope): description
refactor(scope): description
test(scope): description
docs(scope): description
```

## 3. 构建命令

```bash
npm run dev:weapp   # 开发模式
npm run build:weapp # 生产构建
npm run lint        # ESLint检查
npm run typecheck   # TypeScript类型检查
```

## 4. 分包策略

- 主包：入口页、登录、公共组件、公共工具
- 分包 pagesPet：宠物功能（聊天[主入口]、时光、家庭看板、家族图谱、家庭日历、取名、宠物档案、打卡、食物查询、症状初筛、趋势、疫苗、品种、医院、喂养、慢性病追踪）
- 分包 pagesUser：用户功能（个人资料、设置、引导、协议、邀请）
- TabBar：聊天(pagesPet/chat/index) / 时光 / 家庭 / 我的
