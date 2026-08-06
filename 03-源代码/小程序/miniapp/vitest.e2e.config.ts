import { defineConfig } from 'vitest/config';

/**
 * E2E 端到端测试专用配置
 *
 * 与单元测试（vitest.config.ts）共用 jsdom 环境和 Taro mock 初始化（src/test/setup.ts），
 * 但只收集 src/__e2e__ 目录下的用例，验证"注册登录 → 添加宠物 → 打卡 → 对话 → 家庭 → 会员 → 疫苗"
 * 等完整用户主流程，避免与普通单测混跑。
 *
 * 运行方式：npm run test:e2e
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/__e2e__/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
