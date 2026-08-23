/**
 * 全家福提示词构建单元测试
 * 重点验证「提示词安全」，防止重演线上翻车：
 * 1. 宠物名字绝不进入提示词（猫咪叫「烧鸡」不能被画成一只鸡）
 * 2. 数量与物种明确（四只猫不会被画成一只）
 * 3. 品种为空时有兜底（不出现空串/undefined）
 * 4. 含参考图一致性约束与主体锁定（对应提示词库 §0.6/§四）
 */
import { describe, it, expect, vi } from 'vitest';

// mock 数据库与配置，避免单测触发真实连接
vi.mock('../db.js', () => ({ pool: { query: vi.fn() } }));
vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    seedream: { apiKey: 'test-seedream-key' },
    meshy: { apiKey: '' },
    wechat: { appId: '', secret: '' },
    uploadDir: './uploads',
  },
}));

import { buildPrompt, FAMILY_PHOTO_STYLES, type MemberInfo } from './familyPhotoService.js';

/** 模拟用户家的四只猫（其中一只叫「烧鸡」——名字绝不能进入提示词） */
const fourCats: MemberInfo[] = [
  { petId: 'p1', name: '烧鸡', species: 'cat', breed: '英短', photoUrl: 'https://example.com/1.jpg' },
  { petId: 'p2', name: '奶茶', species: 'cat', breed: '美短', photoUrl: 'https://example.com/2.jpg' },
  { petId: 'p3', name: '布丁', species: 'cat', breed: '布偶', photoUrl: 'https://example.com/3.jpg' },
  { petId: 'p4', name: '团子', species: 'cat', breed: '中华田园', photoUrl: 'https://example.com/4.jpg' },
];

describe('buildPrompt 提示词安全', () => {
  it('提示词中绝不出现宠物名字（「烧鸡」不能被画成鸡）', () => {
    const prompt = buildPrompt(fourCats, 'pixar');
    // 名字不进提示词
    expect(prompt).not.toContain('烧鸡');
    expect(prompt).not.toContain('奶茶');
    // 旧模板的英文 named 结构必须消失
    expect(prompt).not.toContain('named');
    // 不出现任何"鸡"相关英文词
    expect(prompt).not.toContain('chicken');
    expect(prompt).not.toContain('roast');
  });

  it('明确数量与物种：四只猫不会被画成一只', () => {
    const prompt = buildPrompt(fourCats, 'pixar');
    expect(prompt).toContain('4只猫咪');
    expect(prompt).toContain('猫咪');
    expect(prompt).not.toContain('狗狗');
    expect(prompt).toContain('不要出现其他动物');
  });

  it('每只宠物的品种都写入提示词（外貌描述更具体）', () => {
    const prompt = buildPrompt(fourCats, 'ghibli');
    expect(prompt).toContain('英短');
    expect(prompt).toContain('美短');
    expect(prompt).toContain('布偶');
    expect(prompt).toContain('中华田园');
  });

  it('品种为空时使用兜底描述，不出现空串/undefined', () => {
    const members: MemberInfo[] = [
      { petId: 'p1', name: '烧鸡', species: 'cat', breed: '', photoUrl: null },
      { petId: 'p2', name: '旺财', species: 'cat', breed: null, photoUrl: null },
    ];
    const prompt = buildPrompt(members, 'oil');
    expect(prompt).not.toContain('undefined');
    expect(prompt).not.toContain('null');
    expect(prompt).toContain('毛茸茸的猫咪');
    expect(prompt).toContain('2只猫咪');
  });

  it('猫狗混合家庭分别计数', () => {
    const members: MemberInfo[] = [
      { petId: 'p1', name: '咪咪', species: 'cat', breed: '英短', photoUrl: null },
      { petId: 'p2', name: '旺财', species: 'dog', breed: '金毛', photoUrl: null },
      { petId: 'p3', name: '小白', species: 'dog', breed: '萨摩耶', photoUrl: null },
    ];
    const prompt = buildPrompt(members, 'nordic');
    expect(prompt).toContain('1只猫咪');
    expect(prompt).toContain('2只狗狗');
    expect(prompt).toContain('一只金毛狗狗');
    expect(prompt).toContain('一只萨摩耶狗狗');
  });

  it('包含参考图一致性约束与主体锁定（对应提示词库角色锁定规范）', () => {
    const prompt = buildPrompt(fourCats, 'ink');
    expect(prompt).toContain('参考图');
    expect(prompt).toContain('完全一致');
    expect(prompt).toContain('不增减数量');
    expect(prompt).toContain('不要出现其他动物、人物或食物');
  });
});

describe('FAMILY_PHOTO_STYLES 全部风格可用', () => {
  it('6 种风格均有完整提示词（风格词 + 主体约束）', () => {
    for (const style of FAMILY_PHOTO_STYLES) {
      const prompt = buildPrompt(fourCats, style);
      expect(prompt.length).toBeGreaterThan(80);
    }
  });

  it('风格关键词已接入提示词库 §六（抽查皮克斯/吉卜力/赛博朋克/水墨）', () => {
    expect(buildPrompt(fourCats, 'pixar')).toContain('Pixar style');
    expect(buildPrompt(fourCats, 'ghibli')).toContain('Studio Ghibli style');
    expect(buildPrompt(fourCats, 'cyberpunk')).toContain('neon lights');
    expect(buildPrompt(fourCats, 'ink')).toContain('Chinese ink wash painting');
    expect(buildPrompt(fourCats, 'nordic')).toContain('Scandinavian design');
    expect(buildPrompt(fourCats, 'oil')).toContain('impasto');
  });
});
