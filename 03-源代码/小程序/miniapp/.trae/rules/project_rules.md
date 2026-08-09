# 星河宠记小程序 - 项目规则

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

- 主包：核心页面（首页、登录、我的、设置、协议）
- 分包 pagesPet：宠物功能（打卡、食物查询、症状初筛、趋势、疫苗、品种、档案）
- 分包 pagesUser：用户功能（个人资料、会员）
