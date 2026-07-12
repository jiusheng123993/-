# 星寰海小程序 - 项目规则

> 本文件为小程序项目特定规则。全局规则已在主项目 `.trae/rules/` 中定义，Agent 必须同时遵守。

## 1. 开发环境

- Node.js >= 18
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

- 主包：急救核心（首页、急救流程、登录）
- 分包1：社区（树洞）
- 分包2：日历
- 分包3：成长（情绪记录、报告）
