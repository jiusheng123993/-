/**
 * agentService 安全守卫（preScreenRisk + guardCheckInput）单元测试
 *
 * 背景（2026-09 成本优化）：/api/agent/chat 原来每条消息都调一次付费 LLM 安全守卫。
 * 现改为：先做规则预筛（preScreenRisk），命中"用户危机/虐待/遗弃/弃养"等信号才调 LLM 守卫；
 * 良性消息直接放行省成本；命中预筛时守卫异常按 fail-closed 拦截。
 * 本测试锁定：①预筛命中/不误伤两侧；②guardCheckInput 的 no-key/!ok/非法响应/缺字段/裁决。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// 可变 apiKey（getter 实时读取），便于同时测 no-key 分支与 fetch 分支
const state = vi.hoisted(() => ({ apiKey: 'test-key' }));
vi.mock('../config.js', () => ({
  config: {
    ai: {
      get apiKey() { return state.apiKey; },
      baseUrl: 'https://mock-ark',
      model: 'mock-model',
    },
  },
}));

import { preScreenRisk, guardCheckInput } from '../services/agentService.js';

describe('preScreenRisk 安全预筛', () => {
  describe('应命中：自伤/轻生/危机', () => {
    it.each([
      '我不想活了', '我想自杀', '活不下去了，想割腕', '我想死', '想死', '想去死',
      '活着没意思', '我撑不下去了', '活着好累', '太痛苦了不如死了算了',
      '我想结束这一切', '伤害自己', '离开这个世界', '活该去死', '不想见任何人', '不想活',
    ])('命中: %s', (msg) => { expect(preScreenRisk(msg)).toBe(true); });
  });

  describe('应命中：虐待/伤害（含把字句）', () => {
    it.each([
      '我在虐待我家猫', '它成天被打，我想家暴它', '我每天打它', '我要揍死它',
      '把它往死里打', '把它饿死', '我要打死它',
    ])('命中: %s', (msg) => { expect(preScreenRisk(msg)).toBe(true); });
  });

  describe('应命中：遗弃/弃养/送人（含把字句）', () => {
    it.each([
      '我想遗弃这只狗', '不想养了，把它送走', '把它扔了', '把它送人',
      '我要把它丢了', '把它丢弃了', '我不想要这只猫了', '再闹就把你送走',
      '把它送走', '把猫扔掉', '我不想要它了',
    ])('命中: %s', (msg) => { expect(preScreenRisk(msg)).toBe(true); });
  });

  describe('不应误伤：宠物健康/日常/口语死语', () => {
    it.each([
      '猫这两天有点抑郁，不爱动', '它是不是快死了，我好担心', '狗狗生病了怎么办',
      '它不吃东西，精神不好', '带它去打疫苗', '它把花瓶打碎了', '推荐一些安全的猫粮',
      '帮我记录一下今天的心情', '笑死我了', '累死我了', '把它放在笼子里吧',
      '它已经去世了，我很想念它', '狗狗去世了',
    ])('不命中: %s', (msg) => { expect(preScreenRisk(msg)).toBe(false); });
  });

  describe('边界', () => {
    it('空串为 false', () => expect(preScreenRisk('')).toBe(false));
    it('纯空白为 false', () => expect(preScreenRisk('   ')).toBe(false));
  });
});

describe('guardCheckInput fail-closed 语义与裁决', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    state.apiKey = 'test-key';
  });

  function stubFetch(impl: () => Promise<Response>) {
    globalThis.fetch = vi.fn(impl) as unknown as typeof fetch;
  }
  function okResponse(content: string): Response {
    return new Response(
      JSON.stringify({ choices: [{ message: { content } }] }),
      { status: 200 },
    );
  }

  it('no-key + failClosed=true → 拦截', async () => {
    state.apiKey = '';
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(true);
  });
  it('no-key + failClosed=false → 放行', async () => {
    state.apiKey = '';
    const r = await guardCheckInput('text');
    expect(r.blocked).toBe(false);
  });
  it('服务 500 + failClosed=true → 拦截', async () => {
    stubFetch(() => Promise.resolve(new Response('server error', { status: 500 })));
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(true);
  });
  it('返回非 JSON + failClosed=true → 拦截', async () => {
    stubFetch(() => Promise.resolve(okResponse('not json')));
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(true);
  });
  it('缺字段 {} + failClosed=true → 拦截（P1-2 修复）', async () => {
    stubFetch(() => Promise.resolve(okResponse('{}')));
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(true);
  });
  it('缺字段 + failClosed=false → 放行', async () => {
    stubFetch(() => Promise.resolve(okResponse('{}')));
    const r = await guardCheckInput('text');
    expect(r.blocked).toBe(false);
  });
  it('isCrisis=true → 拦截并给热线', async () => {
    stubFetch(() => Promise.resolve(okResponse(JSON.stringify({ isCrisis: true, score: 10 }))));
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(true);
    expect(r.reason).toContain('400-161-9995');
  });
  it('score>=8 → 拦截', async () => {
    stubFetch(() => Promise.resolve(okResponse(JSON.stringify({ isCrisis: false, score: 8 }))));
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(true);
  });
  it('score<8 → 放行', async () => {
    stubFetch(() => Promise.resolve(okResponse(JSON.stringify({ isCrisis: false, score: 3 }))));
    const r = await guardCheckInput('text', { failClosed: true });
    expect(r.blocked).toBe(false);
  });
});
