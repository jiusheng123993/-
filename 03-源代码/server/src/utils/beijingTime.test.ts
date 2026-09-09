/**
 * 北京时区归组校准回归锁（审查⏳1：全链路 UTC 时区归组专项）
 *
 * 缺陷背景：生产 PG/Node 默认 UTC，此前「今日」判定与 SQL 日期归组均按 UTC 执行，
 * 北京时间 0-8 点的打卡/喂养/查询被归到前一天——每日摘要错日、今日去重失效、趋势归组漂移。
 *
 * 本文件锁定两层口径，任何回退（改回 UTC 或裸 ::date）都会被这里拦下：
 * 1. JS 侧「今日」= beijingDateString()（北京墙钟日期）
 * 2. SQL 侧归组 = (created_at AT TIME ZONE 'Asia/Shanghai')::date（与 memoryService 先例同口径）
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { beijingDateString } from './beijingTime.js';

describe('beijingDateString（JS 侧北京「今日」）', () => {
  it('UTC 16:30（北京次日 00:30）→ 归北京次日，而非 UTC 当日', () => {
    // 2026-09-08T16:30:00Z = 北京 2026-09-09 00:30
    expect(beijingDateString(new Date('2026-09-08T16:30:00Z'))).toBe('2026-09-09');
  });

  it('UTC 15:59（北京 23:59）→ 仍是北京当日', () => {
    // 2026-09-08T15:59:00Z = 北京 2026-09-08 23:59
    expect(beijingDateString(new Date('2026-09-08T15:59:00Z'))).toBe('2026-09-08');
  });

  it('白天场景（UTC 04:00 = 北京 12:00）与 UTC 日期一致', () => {
    expect(beijingDateString(new Date('2026-09-08T04:00:00Z'))).toBe('2026-09-08');
  });

  it('默认参数（当前时刻）返回 YYYY-MM-DD 格式', () => {
    expect(beijingDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('SQL 侧北京时区归组口径锁（防回退）', () => {
  const src = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf-8');

  const mustContain = (rel: string, snippet: string) => {
    it(`${rel} 含「${snippet.slice(0, 46)}…」`, () => {
      expect(src(rel)).toContain(snippet);
    });
  };

  // 各归组点必须显式声明北京时区（memoryService.ts 先例口径）
  mustContain('repositories/checkinRepository.ts', "(created_at AT TIME ZONE 'Asia/Shanghai')::date");
  mustContain('repositories/foodRepository.ts', "(created_at AT TIME ZONE 'Asia/Shanghai')::date");
  mustContain('repositories/trendRepository.ts', "(created_at AT TIME ZONE 'Asia/Shanghai')::date");
  mustContain('repositories/trendRepository.ts', "($3::date AT TIME ZONE 'Asia/Shanghai')");
  mustContain('services/weeklyReportService.ts', "(h.created_at AT TIME ZONE 'Asia/Shanghai')::date");
  mustContain('services/agentTools.ts', "(created_at AT TIME ZONE 'Asia/Shanghai')::date");

  // JS 侧「今日」必须走 helper
  mustContain('routes/checkins.ts', 'beijingDateString()');
  mustContain('routes/food.ts', 'beijingDateString()');
  mustContain('routes/membership.ts', 'beijingDateString()');
  mustContain('services/agentTools.ts', 'beijingDateString()');

  it('仓库层不得残留裸 created_at::date（UTC 归组）', () => {
    for (const rel of [
      'repositories/checkinRepository.ts',
      'repositories/foodRepository.ts',
      'repositories/trendRepository.ts',
    ]) {
      expect(src(rel).match(/created_at::date/g)).toBeNull();
    }
  });
});
