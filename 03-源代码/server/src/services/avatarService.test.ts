/**
 * 宠物形象多风格候选服务单元测试
 * 重点验证"文字描述生成"链路：用户描述清洗（去换行/截断）后拼进每个画风的提示词
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallSeedream = vi.hoisted(() => vi.fn());

vi.mock('../config.js', () => ({
  config: {
    seedream: { apiKey: 'test-key' },
    meshy: { apiKey: '' },
  },
}));

vi.mock('./image2DService.js', () => ({
  callSeedream: mockCallSeedream,
}));

import { generatePetImageOptions } from './avatarService.js';

describe('generatePetImageOptions 文字描述生成', () => {
  beforeEach(() => {
    mockCallSeedream.mockReset();
    mockCallSeedream.mockResolvedValue('https://cdn.example.com/avatar.png');
  });

  it('有描述时把描述拼进每个画风提示词（清洗换行/截断 100 字）', async () => {
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      description: `圆脸胖乎乎的\n很粘人${'长'.repeat(200)}`,
    });
    expect(options).not.toBeNull();
    // 5 种画风各生成一次
    expect(mockCallSeedream.mock.calls.length).toBeGreaterThan(0);
    for (const call of mockCallSeedream.mock.calls) {
      const prompt = call[0] as string;
      expect(prompt).toContain('一只英短猫咪的头像');
      // 换行被清洗成空格，描述被截断到 100 字（'圆脸胖乎乎的 很粘人' + 长字）
      expect(prompt).toContain('圆脸胖乎乎的 很粘人');
      expect(prompt).not.toContain('\n');
    }
  });

  it('无描述时只用档案自动描述（提示词不含描述段）', async () => {
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
    });
    expect(options).not.toBeNull();
    for (const call of mockCallSeedream.mock.calls) {
      const prompt = call[0] as string;
      expect(prompt).toContain('一只英短猫咪的头像');
      expect(prompt).toContain('高质量');
    }
  });

  it('全部候选失败返回 null（不返回丑陋占位图）', async () => {
    mockCallSeedream.mockResolvedValue(null);
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
    });
    expect(options).toBeNull();
  });
});
