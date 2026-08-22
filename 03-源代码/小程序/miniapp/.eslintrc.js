module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'taro/react'
  ],
  // TS 项目：显式指定 parser 与插件（原 'taro/typescript' 是 eslint-config-taro 中不存在的幽灵配置，2026-08-22 修复）
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // 原 'react/react-hooks/*' 规则 ID 错误（react-hooks 是独立插件，非 react 插件子规则），已修正
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Taro 项目由 babel 自动注入 React，无需手动 import，关闭 react-in-jsx-scope（项目级误报）
    'react/react-in-jsx-scope': 'off',
    // TS 接管未使用变量检测；关闭 base 规则避免类型用法误报（TS 类型导入会被 base 规则误判）
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
}
