/**
 * 慢性病风险扫描 - L2 规则预警单测
 * 覆盖：高风险频率、体重异常、持续异常、数据不足
 */
import { describe, it, expect } from 'vitest';
import { ruleBasedSignals, type CheckinRow } from '../services/chronicRiskService.js';

/** 构造打卡行（默认正常） */
function row(overrides: Partial<CheckinRow> = {}, dayOffset = 0): CheckinRow {
  return {
    weight: '5.0',
    spirit_level: 3,
    appetite_level: 3,
    poop_level: 3,
    exercise_level: 2,
    note: null,
    created_at: new Date(Date.now() - dayOffset * 86400000),
    risk_level: 'low',
    ...overrides,
  };
}

describe('ruleBasedSignals - L2 规则预警', () => {
  it('数据不足（<3 条）不预警，避免误报', () => {
    const rows = [row(), row({}, 1)];
    expect(ruleBasedSignals(rows)).toEqual([]);
  });

  it('高风险频率 ≥30% 且 ≥5 天 → alert 信号', () => {
    const rows: CheckinRow[] = [];
    for (let i = 0; i < 10; i++) {
      rows.push(row({ risk_level: i < 5 ? 'high' : 'low' }, i));
    }
    const signals = ruleBasedSignals(rows);
    const highRisk = signals.find((s) => s.type === 'high_risk_frequency');
    expect(highRisk).toBeDefined();
    expect(highRisk!.level).toBe('alert');
    expect(highRisk!.detail).toContain('50%');
  });

  it('高风险频率 15-30% 且 ≥3 天 → warning 信号', () => {
    const rows: CheckinRow[] = [];
    for (let i = 0; i < 20; i++) {
      rows.push(row({ risk_level: i < 4 ? 'high' : 'low' }, i));
    }
    const signals = ruleBasedSignals(rows);
    const highRisk = signals.find((s) => s.type === 'high_risk_frequency');
    expect(highRisk).toBeDefined();
    expect(highRisk!.level).toBe('warning');
  });

  it('体重下降 ≥10% → alert 信号（含疑似方向）', () => {
    const rows = [
      row({ weight: '5.0' }, 30),
      row({ weight: '4.6' }, 20),
      row({ weight: '4.4' }, 10),
      row({ weight: '4.3' }, 0),
    ];
    const signals = ruleBasedSignals(rows);
    const weight = signals.find((s) => s.type === 'weight_abnormal');
    expect(weight).toBeDefined();
    expect(weight!.level).toBe('alert');
    expect(weight!.detail).toContain('5kg');
    expect(weight!.detail).toContain('4.3kg');
    expect(weight!.suggestedCondition).toContain('疑似');
  });

  it('体重上升 ≥15% → warning 信号', () => {
    const rows = [
      row({ weight: '4.0' }, 30),
      row({ weight: '4.4' }, 20),
      row({ weight: '4.6' }, 10),
      row({ weight: '4.7' }, 0),
    ];
    const signals = ruleBasedSignals(rows);
    const weight = signals.find((s) => s.type === 'weight_abnormal');
    expect(weight).toBeDefined();
    expect(weight!.level).toBe('warning');
  });

  it('连续异常 ≥3 天 → warning 信号', () => {
    const rows = [
      row({ appetite_level: 3, spirit_level: 3, poop_level: 3 }, 5),
      row({ appetite_level: 2, spirit_level: 2, poop_level: 2 }, 4),
      row({ appetite_level: 2, spirit_level: 2, poop_level: 2 }, 3),
      row({ appetite_level: 1, spirit_level: 2, poop_level: 2 }, 2),
      row({ appetite_level: 1, spirit_level: 1, poop_level: 2 }, 1),
    ];
    const signals = ruleBasedSignals(rows);
    const persistent = signals.find((s) => s.type === 'persistent_anomaly');
    expect(persistent).toBeDefined();
    expect(persistent!.level).toBe('warning');
    expect(persistent!.detail).toContain('4 天');
  });

  it('全部正常 → 无信号', () => {
    const rows = Array.from({ length: 30 }, (_, i) => row({}, i));
    expect(ruleBasedSignals(rows)).toEqual([]);
  });
});
