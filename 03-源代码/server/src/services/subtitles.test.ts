/**
 * ASS 字幕生成器单元测试（M4）
 * 覆盖：
 *   1. toAssTime 时间格式转换（含边界）
 *   2. buildAssContent 正常生成（头部/样式/事件行）
 *   3. 无效字幕过滤（空文本/时间倒挂）
 *   4. 特殊字符转义（换行/花括号）
 */
import { describe, it, expect } from 'vitest';
import { buildAssContent, toAssTime, type SubtitleItem } from './subtitles.js';

describe('subtitles ASS 字幕生成', () => {
  describe('toAssTime 时间格式', () => {
    it('基本转换 h:mm:ss.cc', () => {
      expect(toAssTime(0)).toBe('0:00:00.00');
      expect(toAssTime(5)).toBe('0:00:05.00');
      expect(toAssTime(75.5)).toBe('0:01:15.50');
      expect(toAssTime(3600 + 120 + 3.25)).toBe('1:02:03.25');
    });

    it('负数按 0 处理', () => {
      expect(toAssTime(-3)).toBe('0:00:00.00');
    });
  });

  describe('buildAssContent 生成', () => {
    const subtitles: SubtitleItem[] = [
      { startSec: 0, endSec: 5, text: '2016 年夏天 · 初遇' },
      { startSec: 5, endSec: 10, text: '它总在黄昏蹲在窗台' },
    ];

    it('包含脚本头与样式定义', () => {
      const content = buildAssContent(subtitles);
      expect(content).toContain('[Script Info]');
      expect(content).toContain('[V4+ Styles]');
      expect(content).toContain('Noto Sans CJK SC');
      expect(content).toContain('[Events]');
    });

    it('每条字幕生成一行 Dialogue', () => {
      const content = buildAssContent(subtitles);
      expect(content).toContain('Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,2016 年夏天 · 初遇');
      expect(content).toContain('Dialogue: 0,0:00:05.00,0:00:10.00,Default,,0,0,0,,它总在黄昏蹲在窗台');
    });

    it('自定义样式生效', () => {
      const content = buildAssContent(subtitles, { fontSize: 60, fontName: '微软雅黑' });
      expect(content).toContain('微软雅黑,60');
    });

    it('空字幕列表 → 只有头部', () => {
      const content = buildAssContent([]);
      expect(content).toContain('[Events]');
      expect(content.split('Dialogue:').length - 1).toBe(0);
    });
  });

  describe('无效字幕过滤', () => {
    it('空文本被过滤', () => {
      const content = buildAssContent([
        { startSec: 0, endSec: 5, text: '  ' },
        { startSec: 0, endSec: 5, text: '有效字幕' },
      ]);
      expect(content).toContain('有效字幕');
      expect(content.split('Dialogue:').length - 1).toBe(1);
    });

    it('时间倒挂被过滤', () => {
      const content = buildAssContent([
        { startSec: 10, endSec: 5, text: '时间倒挂' },
        { startSec: 0, endSec: 3, text: '正常字幕' },
      ]);
      expect(content).toContain('正常字幕');
      expect(content).not.toContain('时间倒挂');
    });
  });

  describe('特殊字符转义', () => {
    it('换行转 \\N，花括号移除（防 ASS 语法破坏）', () => {
      const content = buildAssContent([
        { startSec: 0, endSec: 5, text: '第一行\n第二行 {可疑}' },
      ]);
      expect(content).toContain('第一行\\N第二行 可疑');
      expect(content).not.toContain('{');
    });
  });
});
