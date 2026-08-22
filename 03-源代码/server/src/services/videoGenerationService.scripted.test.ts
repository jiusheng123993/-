/**
 * 视频生成服务 - 分镜驱动新管线测试（M6）
 * 覆盖：
 *   1. script 存在 → 走分镜驱动管线（engine=seedance-scripted-vlog）
 *   2. 每镜 prompt 经 M2 组装且包含身份锚点
 *   3. script 不存在 → 走旧管线（兼容）
 *   4. 片段生成失败 → 抛错
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mock config（seedance 已配置 → 走真实模式）
vi.mock('../config.js', () => {
  const config = {
    seedance: { apiKey: 'seedance-key', model: 'doubao-seedance-1-5-pro-251215' },
    seedream: { apiKey: 'seedream-key' },
    uploadDir: './uploads',
    publicBaseUrl: 'https://api.example.com',
    doubaoSpeech: { apiKey: '', resourceId: 'seed-tts-2.0', voice: 'v', baseUrl: '' },
  };
  return { config };
});

// mock seedance adapter（片段生成成功）
vi.mock('../adapters/seedanceAdapter.js', () => ({
  createVideoGenerationTask: vi.fn(),
  queryVideoTask: vi.fn(),
  isSeedanceConfigured: vi.fn().mockReturnValue(true),
}));

// mock ffmpeg/ffprobe（execFile callback 成功；兼容 execFile(cmd,args,cb) 与 execFile(cmd,args,options,cb)）
vi.mock('node:child_process', () => ({
  execFile: vi.fn().mockImplementation(
    (
      _cmd: string,
      _args: unknown[],
      arg3: unknown,
      arg4?: unknown,
    ) => {
      const cb =
        typeof arg3 === 'function'
          ? (arg3 as (err: Error | null, r: unknown) => void)
          : (arg4 as (err: Error | null, r: unknown) => void);
      if (cb) cb(null, { stdout: '10\n', stderr: '' });
    },
  ),
}));

// mock fs
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
}));

// mock delay
vi.mock('../utils/delay.js', () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

// mock TTS（旁白成功，非降级）
vi.mock('./ttsService.js', () => ({
  synthNarration: vi.fn().mockResolvedValue({ audioPath: '/tmp/nar.mp3', degraded: false, durationSec: 0 }),
}));

import {
  createVideoGenerationTask,
  queryVideoTask,
} from '../adapters/seedanceAdapter.js';
import { generateMemoirVideo } from './videoGenerationService.js';
import { synthNarration } from './ttsService.js';
import { execFile } from 'node:child_process';
import type { MemoirScript } from '../schemas/memoirScript.js';

const mockedCreate = vi.mocked(createVideoGenerationTask);
const mockedQuery = vi.mocked(queryVideoTask);
const mockedExecFile = vi.mocked(execFile);

/** 构造一个合法的分镜脚本（8 镜） */
function makeScript(): MemoirScript {
  const segments = Array.from({ length: 8 }, (_, i) => ({
    photo_index: i,
    shot_type: 'push_in' as const,
    camera: 'close_up' as const,
    lighting: 'golden_hour' as const,
    transition: 'cut' as const,
    duration_sec: 5,
    seedance_prompt:
      'GLOBAL STYLE: 写实风格。SCENE: 橘猫在窗台。CHARACTERS: 参考图1。LOCATION: 窗台。FIRST FRAME: 居中。Shot 1: 推镜。OPTICS: 47度。PHYSICS: 毛发柔软。LIGHTING: 黄昏。AUDIO: 安静。',
    narration: `第${i}镜的旁白文案，有细节。`,
    subtitle: i === 0 ? '2014 年 · 黄昏' : '',
  }));
  return {
    title: '窗台上的第三块砖',
    theme: '陪伴',
    emotion_curve: ['calm', 'memory', 'relief'],
    narration_voice: '晓晓',
    music_mood: 'nostalgic' as const,
    identity_anchor: '橘色短毛猫，白色胸脯，右耳缺一角',
    segments,
  };
}

describe('videoGenerationService 分镜驱动管线', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mock 全局 fetch：片段下载（downloadFile）返回假 mp4 数据
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(100) }),
    );
    // 片段生成成功：create 返回 taskId，query 返回 succeeded + URL
    mockedCreate.mockResolvedValue({ taskId: 'seedance-task', error: null });
    mockedQuery.mockResolvedValue({
      status: 'succeeded',
      videoUrl: 'https://cdn.example.com/seg.mp4',
      error: null,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('script 存在 → 走分镜驱动管线（engine=seedance-scripted-vlog）', async () => {
    const result = await generateMemoirVideo({
      taskId: 'task-scripted',
      productLine: 'memorial',
      sourcePhotos: Array.from({ length: 8 }, (_, i) => `https://cdn/pet${i}.jpg`),
      script: makeScript(),
    });
    expect(result.engine).toBe('seedance-scripted-vlog');
    expect(result.videoUrl).toContain('final.mp4');
    // 8 镜 → 8 次片段创建
    expect(mockedCreate).toHaveBeenCalledTimes(8);
  });

  it('每镜 prompt 经 M2 组装且包含身份锚点', async () => {
    const script = makeScript();
    await generateMemoirVideo({
      taskId: 'task-spy',
      productLine: 'memorial',
      sourcePhotos: Array.from({ length: 8 }, (_, i) => `https://cdn/pet${i}.jpg`),
      script,
    });
    // 直接验证 seedance adapter 收到的 prompt 含身份锚点 + 时长来自分镜
    const createCalls = mockedCreate.mock.calls;
    expect(createCalls.length).toBeGreaterThan(0);
    for (const call of createCalls) {
      const params = call[0] as { prompt: string; duration?: number };
      expect(params.prompt).toContain('橘色短毛猫');
      expect(params.prompt).toContain('COUNT LOCK'); // M2 追加的连续性锁
      expect(params.duration).toBe(5);
    }
  });

  it('script 不存在 → 走旧管线（engine=seedance-memorial-narrative-vlog）', async () => {
    const result = await generateMemoirVideo({
      taskId: 'task-legacy',
      productLine: 'memorial',
      sourcePhotos: Array.from({ length: 8 }, (_, i) => `https://cdn/pet${i}.jpg`),
      duration: 60,
      script: null,
    });
    expect(result.engine).toBe('seedance-memorial-narrative-vlog');
  });

  it('片段生成失败 → 抛错', async () => {
    mockedCreate.mockResolvedValue({ taskId: 'task-fail', error: 'create failed' });
    await expect(
      generateMemoirVideo({
        taskId: 'task-fail',
        productLine: 'memorial',
        sourcePhotos: Array.from({ length: 8 }, (_, i) => `https://cdn/pet${i}.jpg`),
        script: makeScript(),
      }),
    ).rejects.toThrow();
  });

  it('旁白降级不影响视频生成（TTS degraded → 仍返回结果）', async () => {
    // TTS 返回降级（无旁白）
    vi.mocked(synthNarration).mockResolvedValueOnce({
      audioPath: '',
      degraded: true,
      durationSec: 0,
    });
    const result = await generateMemoirVideo({
      taskId: 'task-tts-degraded',
      productLine: 'memorial',
      sourcePhotos: Array.from({ length: 8 }, (_, i) => `https://cdn/pet${i}.jpg`),
      script: makeScript(),
    });
    expect(result.engine).toBe('seedance-scripted-vlog');
    expect(result.videoUrl).toContain('final.mp4');
  });

  it('static_photo 镜头（全家福）不调 Seedance，走 ffmpeg zoompan', async () => {
    const script = makeScript();
    // 最后一镜改为 static_photo（全家福合影）
    script.segments[script.segments.length - 1] = {
      ...script.segments[script.segments.length - 1],
      source: 'static_photo',
    };
    await generateMemoirVideo({
      taskId: 'task-family',
      productLine: 'memorial',
      sourcePhotos: Array.from({ length: 8 }, (_, i) => `https://cdn/pet${i}.jpg`),
      script,
    });
    // 8 镜中 7 镜走 Seedance，1 镜（全家福）走 ffmpeg
    expect(mockedCreate).toHaveBeenCalledTimes(7);
    // ffmpeg（execFile）被调用（zoompan 生成静态动效 + 最终拼接）
    expect(mockedExecFile).toHaveBeenCalled();
  });
});
