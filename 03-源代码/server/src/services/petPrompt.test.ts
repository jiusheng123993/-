/**
 * 宠物提示词公共模块单元测试
 * 所有 AI 生图服务（全家福/头像/2D 表情包）共用此模块，重点验证：
 * 1. 绝不包含宠物名字（防「烧鸡」被画成鸡）
 * 2. 品种为空/含换行/超长时正确清洗兜底
 * 3. 性别前缀与物种中文名正确
 */
import { describe, it, expect } from 'vitest';
import { petSpeciesLabel, petSubjectText, translatePetNames, PET_BREED_FALLBACK, PET_IDENTITY_KEEP, PET_ONLY_ONE } from './petPrompt.js';

describe('petSpeciesLabel 物种中文名', () => {
  it('dog → 狗狗，cat → 猫咪，未知物种兜底为猫咪', () => {
    expect(petSpeciesLabel('dog')).toBe('狗狗');
    expect(petSpeciesLabel('cat')).toBe('猫咪');
    expect(petSpeciesLabel('rabbit')).toBe('猫咪');
  });
});

describe('petSubjectText 主体描述', () => {
  it('正常品种：一只英短猫咪（绝不包含名字——名字由调用方传入也不得进入）', () => {
    // 注意：petSubjectText 签名就没有名字参数，名字结构上无法泄漏
    expect(petSubjectText('英短', 'cat')).toBe('一只英短猫咪');
    expect(petSubjectText('金毛', 'dog')).toBe('一只金毛狗狗');
  });

  it('品种为空/undefined/null 时使用兜底描述', () => {
    expect(petSubjectText('', 'cat')).toBe(`一只${PET_BREED_FALLBACK}猫咪`);
    expect(petSubjectText(null, 'cat')).toBe(`一只${PET_BREED_FALLBACK}猫咪`);
    expect(petSubjectText(undefined, 'cat')).toBe(`一只${PET_BREED_FALLBACK}猫咪`);
  });

  it('「不确定品种」及同类口语词按品种缺失兜底（防文生图把「不确定」当指令）', () => {
    expect(petSubjectText('不确定品种', 'cat')).toBe(`一只${PET_BREED_FALLBACK}猫咪`);
    expect(petSubjectText('不确定品种', 'dog')).toBe(`一只${PET_BREED_FALLBACK}狗狗`);
    expect(petSubjectText('混血', 'cat')).toBe(`一只${PET_BREED_FALLBACK}猫咪`);
    expect(petSubjectText('土猫串串', 'cat')).toBe(`一只${PET_BREED_FALLBACK}猫咪`);
  });

  it('品种含换行/多余空白时清洗并截断（防污染提示词结构）', () => {
    expect(petSubjectText('英短\n布偶', 'cat')).toBe('一只英短 布偶猫咪');
    expect(petSubjectText('  中华田园  ', 'cat')).toBe('一只中华田园猫咪');
    // 超长品种截断到 20 字
    expect(petSubjectText('非常非常非常非常非常非常非常非常非常非常非常长的品种名', 'cat')).toHaveLength('一只'.length + 20 + '猫咪'.length);
  });

  it('性别前缀正确插入：一只母英短猫咪 / 一只公金毛狗狗', () => {
    expect(petSubjectText('英短', 'cat', '母')).toBe('一只母英短猫咪');
    expect(petSubjectText('金毛', 'dog', '公')).toBe('一只公金毛狗狗');
  });
});

describe('约束常量（对应提示词库 §0.6/§四）', () => {
  it('角色一致性约束包含毛色/花纹/体型/五官锁定', () => {
    expect(PET_IDENTITY_KEEP).toContain('参考图');
    expect(PET_IDENTITY_KEEP).toContain('毛色');
    expect(PET_IDENTITY_KEEP).toContain('完全一致');
  });

  it('主体锁定禁止出现其他动物/人物/食物', () => {
    expect(PET_ONLY_ONE).toContain('只出现这一只宠物');
    expect(PET_ONLY_ONE).toContain('不要出现其他动物');
  });
});

describe('translatePetNames 名字→外貌指代转译（用户用名字说话，模型收到外貌语言）', () => {
  const twoPets = [
    { name: '烧鸡', breed: '英短', species: 'cat' },
    { name: '烧鸭', breed: '田园白猫', species: 'cat' },
  ];

  it('单只宠物：「烧鸡戴生日帽」→「那只英短猫咪戴生日帽」，名字不残留', () => {
    const out = translatePetNames('烧鸡戴着生日帽', [twoPets[0]]);
    expect(out).toBe('那只英短猫咪戴着生日帽');
    expect(out).not.toContain('烧鸡');
  });

  it('多只宠物：按数组顺序生成「左起第一只/第二只」方位指代（配合全家福排位）', () => {
    const out = translatePetNames('烧鸡追着烧鸭跑', twoPets);
    expect(out).toBe('左起第一只英短猫咪追着左起第二只田园白猫猫咪跑');
    expect(out).not.toContain('烧鸡');
    expect(out).not.toContain('烧鸭');
  });

  it('名字集合外的词一律不动；未命中时原样返回', () => {
    expect(translatePetNames('铺满落叶的秋日森林小径', twoPets)).toBe('铺满落叶的秋日森林小径');
    expect(translatePetNames('', twoPets)).toBe('');
  });

  it('空名/超长名跳过；重名去重不产生序号空洞；长名优先替换防子串误伤', () => {
    // 空名与 >20 字名不参与转译
    const weird = [
      { name: '  ', breed: '英短', species: 'cat' },
      { name: 'x'.repeat(21), breed: '英短', species: 'cat' },
      { name: '咪咪', breed: '', species: 'cat' },
    ];
    expect(translatePetNames('咪咪在睡觉', weird)).toBe(`那只${PET_BREED_FALLBACK}猫咪在睡觉`);
    // 「小猫咪」包含「小猫」：长名先替换，剩余文本再替换短名
    const pair = [
      { name: '小猫', breed: '橘猫', species: 'cat' },
      { name: '小猫咪', breed: '蓝猫', species: 'cat' },
    ];
    const out = translatePetNames('小猫咪和小猫在玩', [...pair].reverse());
    expect(out).not.toContain('小猫咪和小猫');
  });
});
