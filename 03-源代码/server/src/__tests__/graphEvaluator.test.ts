/**
 * 图谱评估器单测（Phase 3 收尾：聊天路径消费权威图谱）
 * 覆盖：文本→症状映射、规则评估（紧急单/组合/时长条件/无命中保守档）、draft 过滤、加载降级
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetLatestGraph } = vi.hoisted(() => ({ mockGetLatestGraph: vi.fn() }));

// 仓库 mock：仅暴露 getLatestGraph（挂 hoisted mock，测试内可配置返回值）
vi.mock('../repositories/knowledgeRepository.js', () => {
  class MockKnowledgeGraphRepository {
    getLatestGraph = mockGetLatestGraph;
  }
  return { KnowledgeGraphRepository: MockKnowledgeGraphRepository };
});

import { loadActiveGraph, mapSymptomTextToIds, evaluateSymptomLevel, type GraphData } from '../services/graphEvaluator.js';

/** 最小图谱夹具（含 draft 规则与时长条件规则） */
const fixtureGraph: GraphData = {
  version: 'test.1',
  symptoms: [
    { id: 'vomiting', name: '呕吐' },
    { id: 'diarrhea', name: '腹泻' },
    { id: 'seizure', name: '抽搐' },
  ],
  diseases: [],
  riskRules: [
    { id: 'r1', name: '紧急：抽搐', level: 'emergency', priority: 100, match: { type: 'single', symptomIds: ['seizure'] }, sourceRef: { sourceId: 's', reviewStatus: 'reviewed' } },
    { id: 'r2', name: '紧急组合：呕吐+腹泻', level: 'emergency', priority: 90, match: { type: 'combo', symptomIds: ['vomiting', 'diarrhea'] }, sourceRef: { sourceId: 's', reviewStatus: 'reviewed' } },
    { id: 'r3', name: 'draft规则（不应生效）', level: 'emergency', priority: 300, match: { type: 'single', symptomIds: ['vomiting'] }, sourceRef: { sourceId: 's', reviewStatus: 'draft' } },
    { id: 'r4', name: '腹泻持续3天以上', level: 'warning', priority: 80, match: { type: 'combo', symptomIds: ['diarrhea'], conditions: { durationIn: ['3天以上'] } }, sourceRef: { sourceId: 's', reviewStatus: 'reviewed' } },
  ],
};

beforeEach(() => {
  mockGetLatestGraph.mockReset();
});

describe('mapSymptomTextToIds - 自由文本映射', () => {
  it('文本包含症状名 → 映射出对应 ID', () => {
    expect(mapSymptomTextToIds(fixtureGraph, '它呕吐又腹泻')).toEqual(['vomiting', 'diarrhea']);
  });

  it('文本无已知症状名 → 空数组', () => {
    expect(mapSymptomTextToIds(fixtureGraph, '它今天有点蔫')).toEqual([]);
  });
});

describe('evaluateSymptomLevel - 图谱规则评估', () => {
  it('紧急单症状 → emergency', () => {
    expect(evaluateSymptomLevel(fixtureGraph, ['seizure']).level).toBe('emergency');
  });

  it('紧急组合（呕吐+腹泻）→ emergency（draft 规则被过滤）', () => {
    const result = evaluateSymptomLevel(fixtureGraph, ['vomiting', 'diarrhea']);
    expect(result.level).toBe('emergency');
    expect(result.ruleName).toBe('紧急组合：呕吐+腹泻');
  });

  it('draft 规则不生效：单呕吐无其他规则命中 → 保守观察档', () => {
    expect(evaluateSymptomLevel(fixtureGraph, ['vomiting']).level).toBe('caution');
  });

  it('时长条件：3天以上 → warning；时长不匹配 → 回落保守档', () => {
    expect(evaluateSymptomLevel(fixtureGraph, ['diarrhea'], '3天以上').level).toBe('warning');
    expect(evaluateSymptomLevel(fixtureGraph, ['diarrhea'], '1天').level).toBe('caution');
  });

  it('未知症状 ID → 保守观察档', () => {
    expect(evaluateSymptomLevel(fixtureGraph, ['unknown_xyz']).level).toBe('caution');
  });
});

describe('loadActiveGraph - 加载与降级', () => {
  it('仓库返回图谱 → 返回数据', async () => {
    mockGetLatestGraph.mockResolvedValue({ version: 'test.1', data: fixtureGraph });
    const graph = await loadActiveGraph();
    expect(graph).not.toBeNull();
    expect(graph!.riskRules).toHaveLength(4);
  });

  it('仓库返回 null（DB 不可用）→ null（调用方回落关键词）', async () => {
    mockGetLatestGraph.mockResolvedValue(null);
    expect(await loadActiveGraph()).toBeNull();
  });

  it('图谱结构不完整（缺 symptoms）→ null', async () => {
    mockGetLatestGraph.mockResolvedValue({ version: 'bad', data: { version: 'bad', riskRules: [], diseases: [] } });
    expect(await loadActiveGraph()).toBeNull();
  });
});
