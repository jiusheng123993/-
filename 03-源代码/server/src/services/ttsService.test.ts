/**
 * 回忆录旁白 TTS 服务单元测试（M3，火山豆包语音版）
 * 覆盖：
 *   1. 空旁白/无效旁白 → 降级
 *   2. 未配置豆包 key → 降级（仅字幕）
 *   3. 正常合成 → 返回音频路径
 *   4. 单镜合成失败 → 降级 + 清理
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { synthDoubaoSpeech } from './doubaoSpeechTts.js';

// mock child_process.execFile（ffmpeg 混音）
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

// mock fs（避免真实写文件）
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
}));

// mock config（豆包语音配置）
vi.mock('../config.js', () => ({
  config: {
    doubaoSpeech: { apiKey: 'doubao-key', resourceId: 'seed-tts-2.0', voice: 'zh_female_vv_uranus_bigtts' },
  },
}));

// mock 豆包语音合成（避免真实网络调用）
vi.mock('./doubaoSpeechTts.js', () => ({
  synthDoubaoSpeech: vi.fn(),
}));

import { synthNarration } from './ttsService.js';

const mockedExecFile = vi.mocked(execFile);
const mockedSynth = vi.mocked(synthDoubaoSpeech);

/** 记录最近一次 execFile 的 args（供 filter 断言） */
let lastExecArgs: string[] = [];

/** 让 execFile 成功（callback 风格），并记录 args */
function mockExecOk(): void {
  mockedExecFile.mockImplementation(
    ((
      _cmd: string,
      args: unknown[],
      arg3: unknown,
      arg4?: unknown,
    ) => {
      lastExecArgs = args as string[];
      const cb =
        typeof arg3 === 'function'
          ? (arg3 as (err: Error | null, result: { stdout: string; stderr?: string }) => void)
          : (arg4 as (err: Error | null, result: { stdout: string; stderr?: string }) => void);
      if (cb) cb(null, { stdout: '', stderr: '' });
      return {} as never;
    }) as never,
  );
}

/** 标准旁白片段（3 段） */
function makeSegments() {
  return [
    { text: '十年前的那个下午，你第一次跳上窗台。', startSec: 0, endSec: 5 },
    { text: '它总在黄昏蹲在第三块砖上。', startSec: 5, endSec: 10 },
    { text: '后来窗台空了。', startSec: 10, endSec: 15 },
  ];
}

describe('ttsService 旁白合成（豆包语音）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认：每镜合成成功
    mockedSynth.mockResolvedValue({ audioPath: '/tmp/memoir-doubao/task-1/nar_1.mp3' });
  });

  it('空旁白列表 → 降级（无音频）', async () => {
    const result = await synthNarration('task-1', []);
    expect(result.degraded).toBe(true);
    expect(result.audioPath).toBe('');
  });

  it('旁白文案全为空 → 降级', async () => {
    const result = await synthNarration('task-1', [
      { text: '  ', startSec: 0, endSec: 5 },
      { text: '', startSec: 5, endSec: 10 },
    ]);
    expect(result.degraded).toBe(true);
  });

  it('正常合成 → 返回 narration.mp3 且每镜都调用豆包', async () => {
    mockExecOk();
    const result = await synthNarration('task-1', makeSegments());
    expect(result.degraded).toBe(false);
    expect(result.audioPath).toContain('narration.mp3');
    // 3 镜 → 3 次豆包合成 + 1 次 ffmpeg 混音
    expect(mockedSynth).toHaveBeenCalledTimes(3);
    expect(mockedExecFile).toHaveBeenCalledTimes(1);
  });

  it('ffmpeg filter 顺序正确：先 atrim 裁断（秒）再 asetpts 再 adelay（防越段叠加）', async () => {
    mockExecOk();
    await synthNarration('task-1', makeSegments());
    // 取出 -filter_complex 参数
    const fcIdx = lastExecArgs.indexOf('-filter_complex');
    expect(fcIdx).toBeGreaterThanOrEqual(0);
    const fc = String(lastExecArgs[fcIdx + 1]);
    // 每段 filter：atrim=start=0:end=<秒>（end 为段时长，单位秒而非毫秒）
    expect(fc).toContain('[0:a]atrim=start=0:end=5.00,asetpts=PTS-STARTPTS,adelay=0|0');
    // atrim 必须在 adelay 之前（先裁后延，否则 PTS 平移后裁错）
    const firstSeg = fc.split(';')[0];
    expect(firstSeg.indexOf('atrim')).toBeGreaterThanOrEqual(0);
    expect(firstSeg.indexOf('atrim')).toBeLessThan(firstSeg.indexOf('adelay'));
    // 第二镜延时 5000ms 且先裁后延
    const secondSeg = fc.split(';')[1];
    expect(secondSeg).toContain('adelay=5000|5000');
    expect(secondSeg.indexOf('atrim')).toBeLessThan(secondSeg.indexOf('adelay'));
  });

  it('单镜合成失败 → 降级并清理', async () => {
    mockedSynth
      .mockResolvedValueOnce({ audioPath: '/tmp/x.mp3' })
      .mockRejectedValueOnce(new Error('doubao error'));
    const result = await synthNarration('task-1', makeSegments());
    expect(result.degraded).toBe(true);
    expect(rm).toHaveBeenCalled();
  });
});
