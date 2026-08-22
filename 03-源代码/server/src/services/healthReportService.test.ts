/**
 * 体检报告识别服务测试（F8）
 * 覆盖：
 *   1. recognizeHealthReport：正常识别（存表+写记忆）/ 无有效 JSON 返回 null / 异常指标
 *   2. listHealthReports：查询（空/有数据）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mock db（pool 查询）
vi.mock('../db.js', () => ({
  pool: { query: vi.fn() },
}));

// mock visionService（视觉识别）
vi.mock('./visionService.js', () => ({
  analyzeImage: vi.fn(),
  extractJsonFromText: vi.fn(),
}));

// mock memoryService（健康记忆）
vi.mock('./memoryService.js', () => ({
  recordHealthMemory: vi.fn().mockResolvedValue(undefined),
}));

import { pool } from '../db.js';
import { analyzeImage, extractJsonFromText } from './visionService.js';
import { recordHealthMemory } from './memoryService.js';
import { recognizeHealthReport, listHealthReports, HEALTH_REPORT_PROMPT } from './healthReportService.js';

const mockedPool = vi.mocked(pool.query);
const mockedAnalyze = vi.mocked(analyzeImage);
const mockedExtract = vi.mocked(extractJsonFromText);
const mockedRecord = vi.mocked(recordHealthMemory);

describe('healthReportService 体检识别', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认：视觉识别返回指标 JSON
    mockedAnalyze.mockResolvedValue('{"metrics":[{"name":"白细胞","value":"12.5","unit":"10^9/L","range":"5.5-19.5","abnormal":false}],"rawText":"报告"}');
    mockedExtract.mockReturnValue({
      metrics: [{ name: '白细胞', value: '12.5', unit: '10^9/L', range: '5.5-19.5', abnormal: false }],
      rawText: '报告',
    });
    mockedPool.mockResolvedValue({ rows: [], rowCount: 0 } as never);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('识别提示词要求结构化 JSON', () => {
    expect(HEALTH_REPORT_PROMPT).toContain('metrics');
    expect(HEALTH_REPORT_PROMPT).toContain('只输出 JSON');
  });

  it('正常识别：存表 + 写健康记忆（无异常 importance=6）', async () => {
    const result = await recognizeHealthReport({
      userId: 'u1',
      petId: 'p1',
      imageDataUrl: 'data:image/jpeg;base64,xxx',
    });
    expect(result).not.toBeNull();
    expect(result!.metrics).toHaveLength(1);
    expect(result!.hasAbnormal).toBe(false);
    // 存表
    expect(mockedPool).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO health_reports'),
      expect.arrayContaining(['u1', 'p1']),
    );
    // 写记忆
    expect(mockedRecord).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'medical', importance: 6 }),
    );
  });

  it('异常指标 → hasAbnormal=true 且 importance=8', async () => {
    mockedExtract.mockReturnValue({
      metrics: [{ name: '肌酐', value: '180', unit: 'umol/L', range: '44-133', abnormal: true }],
      rawText: '',
    });
    const result = await recognizeHealthReport({ userId: 'u1', petId: 'p1', imageDataUrl: 'x' });
    expect(result!.hasAbnormal).toBe(true);
    expect(mockedRecord).toHaveBeenCalledWith(expect.objectContaining({ importance: 8 }));
  });

  it('无有效 JSON → 返回 null（不存表不写记忆）', async () => {
    mockedExtract.mockReturnValue(null);
    const result = await recognizeHealthReport({ userId: 'u1', petId: 'p1', imageDataUrl: 'x' });
    expect(result).toBeNull();
    expect(mockedPool).not.toHaveBeenCalled();
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  it('空指标数组 → 存表但不写记忆', async () => {
    mockedExtract.mockReturnValue({ metrics: [], rawText: '' });
    const result = await recognizeHealthReport({ userId: 'u1', petId: 'p1', imageDataUrl: 'x' });
    expect(result).not.toBeNull();
    expect(result!.metrics).toHaveLength(0);
    expect(mockedRecord).not.toHaveBeenCalled();
  });

  describe('listHealthReports', () => {
    it('有数据返回列表', async () => {
      mockedPool.mockResolvedValue({
        rows: [{ id: 'r1', report_date: '2026-08-01', metrics: [], raw_text: 'x', created_at: '2026-08-01' }],
        rowCount: 1,
      } as never);
      const reports = await listHealthReports('p1', 'u1', 5);
      expect(reports).toHaveLength(1);
      // 归属校验（user_id）
      expect(mockedPool).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $2'),
        ['p1', 'u1', 5],
      );
    });

    it('空返回空数组', async () => {
      mockedPool.mockResolvedValue({ rows: [], rowCount: 0 } as never);
      const reports = await listHealthReports('p1', 'u1', 5);
      expect(reports).toEqual([]);
    });
  });
});
