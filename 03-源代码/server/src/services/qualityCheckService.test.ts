/**
 * 视频质量质检服务单元测试（M5）
 * 覆盖：
 *   1. frameTimes 抽帧时间点计算
 *   2. buildQualityPrompt 提示词内容
 *   3. checkVideoQuality 正常通过 / 硬失败 / 分数低 / API 失败降级 / 无 key 降级
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';

// mock child_process（ffmpeg 抽帧 / ffprobe 时长）
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// mock fs（读帧/建目录/清理）
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-jpeg-bytes')),
  rm: vi.fn().mockResolvedValue(undefined),
}));

// mock config（质检配置）
vi.mock('../config.js', () => ({
  config: {
    ai: { apiKey: 'ai-key' },
    qualityCheck: {
      apiKey: 'qc-key',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-v4-flash-vision-exp',
    },
  },
}));

import {
  checkVideoQuality,
  frameTimes,
  buildQualityPrompt,
  type QualityCheckParams,
} from './qualityCheckService.js';
import { config } from '../config.js';

const mockedExecFile = vi.mocked(execFile);

/** 让 execFile 成功（ffprobe 返回时长 / ffmpeg 抽帧成功） */
function mockExecOk(stdout = '10\n'): void {
  mockedExecFile.mockImplementation(
    ((
      _cmd: string,
      _args: unknown[],
      arg3: unknown,
      arg4?: unknown,
    ) => {
      const cb =
        typeof arg3 === 'function'
          ? (arg3 as (err: Error | null, result: { stdout: string; stderr?: string }) => void)
          : (arg4 as (err: Error | null, result: { stdout: string; stderr?: string }) => void);
      if (cb) cb(null, { stdout, stderr: '' });
      return {} as never;
    }) as never,
  );
}

/** mock 视觉 API 返回（按帧序号给不同结果） */
function mockVisionApi(frameResults: Array<Record<string, unknown>>): void {
  let callIndex = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => {
      const frame = frameResults[Math.min(callIndex, frameResults.length - 1)];
      callIndex++;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(frame) } }],
        }),
      };
    }),
  );
}

/** 标准合格帧评分 */
const GOOD_FRAME = {
  clarity: 8,
  consistency: 8,
  match: 7,
  defects: [],
  pass: true,
};

function makeParams(overrides: Partial<QualityCheckParams> = {}): QualityCheckParams {
  return {
    videoPath: '/tmp/video.mp4',
    referencePhotoUrl: 'https://example.com/pet.jpg',
    identityAnchor: '橘色短毛猫，白色胸脯',
    ...overrides,
  };
}

describe('qualityCheckService 视频质检', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('frameTimes 抽帧时间点', () => {
    it('5 秒视频抽 5 个均匀时间点', () => {
      const times = frameTimes(5);
      expect(times).toHaveLength(5);
      expect(times[0]).toBeGreaterThanOrEqual(0);
      expect(times[times.length - 1]).toBeLessThan(5);
    });

    it('时长 <= 0 时返回 [0]', () => {
      expect(frameTimes(0)).toEqual([0]);
    });

    it('不超出视频时长', () => {
      const times = frameTimes(3);
      for (const t of times) {
        expect(t).toBeLessThan(3);
      }
    });
  });

  describe('buildQualityPrompt 提示词', () => {
    it('包含评分维度与身份锚点', () => {
      const prompt = buildQualityPrompt('橘色短毛猫');
      expect(prompt).toContain('clarity');
      expect(prompt).toContain('consistency');
      expect(prompt).toContain('橘色短毛猫');
    });

    it('无身份锚点时提示仅检查画面质量', () => {
      expect(buildQualityPrompt()).toContain('无参考特征');
    });
  });

  describe('checkVideoQuality 主流程', () => {
    it('全部帧合格 → 通过', async () => {
      mockExecOk('10\n');
      mockVisionApi([GOOD_FRAME, GOOD_FRAME, GOOD_FRAME, GOOD_FRAME, GOOD_FRAME]);
      const result = await checkVideoQuality(makeParams());
      expect(result.passed).toBe(true);
      expect(result.degraded).toBe(false);
      expect(result.framesChecked).toBe(5);
      expect(result.defects).toEqual([]);
    });

    it('任一帧硬失败（pass=false）→ 不通过', async () => {
      mockExecOk('10\n');
      mockVisionApi([
        GOOD_FRAME,
        { ...GOOD_FRAME, pass: false, defects: ['出现第二只猫'] },
        GOOD_FRAME,
        GOOD_FRAME,
        GOOD_FRAME,
      ]);
      const result = await checkVideoQuality(makeParams());
      expect(result.passed).toBe(false);
      expect(result.defects).toContain('出现第二只猫');
    });

    it('一致性均分低于 6 → 不通过', async () => {
      mockExecOk('10\n');
      mockVisionApi([
        { ...GOOD_FRAME, consistency: 4 },
        { ...GOOD_FRAME, consistency: 5 },
        { ...GOOD_FRAME, consistency: 4 },
        { ...GOOD_FRAME, consistency: 5 },
        { ...GOOD_FRAME, consistency: 4 },
      ]);
      const result = await checkVideoQuality(makeParams());
      expect(result.passed).toBe(false);
    });

    it('视觉 API 调用失败 → 降级放行（degraded=true）', async () => {
      mockExecOk('10\n');
      // 第一次 fetch 抛错（网络失败）
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValueOnce(new Error('network error')),
      );
      // 其余帧正常
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockRejectedValueOnce(new Error('network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ choices: [{ message: { content: JSON.stringify(GOOD_FRAME) } }] }),
          }),
      );
      const result = await checkVideoQuality(makeParams());
      // 有帧失败 → degraded，不阻断
      expect(result.degraded).toBe(true);
    });

    it('无质检 key 且无主 key → 降级放行', async () => {
      mockExecOk('10\n');
      // 临时清空 key（mock config 对象可变）
      const savedQc = config.qualityCheck.apiKey;
      const savedAi = config.ai.apiKey;
      config.qualityCheck.apiKey = '';
      config.ai.apiKey = '';
      const result = await checkVideoQuality(makeParams());
      expect(result.degraded).toBe(true);
      expect(result.passed).toBe(true);
      // 还原
      config.qualityCheck.apiKey = savedQc;
      config.ai.apiKey = savedAi;
    });
  });
});
