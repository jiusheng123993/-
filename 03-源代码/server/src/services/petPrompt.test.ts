/**
 * 宠物提示词公共模块单元测试
 * 所有 AI 生图服务（全家福/头像/2D 表情包）共用此模块，重点验证：
 * 1. 绝不包含宠物名字（防「烧鸡」被画成鸡）
 * 2. 品种为空/含换行/超长时正确清洗兜底
 * 3. 性别前缀与物种中文名正确
 */
import { describe, it, expect } from 'vitest';
import { petSpeciesLabel, petSubjectText, PET_BREED_FALLBACK, PET_IDENTITY_KEEP, PET_ONLY_ONE } from './petPrompt.js';

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
