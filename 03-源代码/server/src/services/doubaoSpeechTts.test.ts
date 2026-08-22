/**
 * 豆包语音 TTS provider 单元测试（M3，SSE 流式版）
 * 覆盖：
 *   1. buildSseBody 请求体结构
 *   2. fetchSseAudio 正常解析 SSE 音频块（base64 拼接）
 *   3. SSE 错误码抛异常
 *   4. HTTP 错误抛异常
 *   5. 无音频数据抛异常
 *   6. synthDoubaoSpeech 全流程写文件
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { synthDoubaoSpeech, fetchSseAudio, buildSseBody, sseEndpoint } from './doubaoSpeechTts.js';

// mock fs
vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
}));

// mock config（豆包语音配置）
vi.mock('../config.js', () => ({
  config: {
    doubaoSpeech: {
      apiKey: 'doubao-key',
      resourceId: 'seed-tts-2.0',
      voice: 'zh_female_vv_uranus_bigtts',
      baseUrl: 'https://openspeech.bytedance.com/api/v3/tts',
    },
  },
}));

const mockedWriteFile = vi.mocked(writeFile);

/** 构造 SSE 响应流 */
function sseStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + '\n'));
      }
      controller.close();
    },
  });
}

/** mock fetch 返回 SSE 流 */
function mockFetchSse(lines: string[], ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      body: sseStream(lines),
    }),
  );
}

/** base64 编码 helper */
function b64(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64');
}

describe('doubaoSpeechTts 豆包语音（SSE）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('SSE 端点由 config.baseUrl 构造（含 unidirectional/sse）', () => {
    expect(sseEndpoint()).toBe('https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse');
  });

  describe('buildSseBody 请求体', () => {
    it('包含 user 与 req_params（text/speaker/audio_params）', () => {
      const body = buildSseBody('测试文本', 'zh_female_xx');
      const req = (body.req_params as Record<string, unknown>);
      expect(req.text).toBe('测试文本');
      expect(req.speaker).toBe('zh_female_xx');
      expect((req.audio_params as Record<string, unknown>).format).toBe('mp3');
      expect(typeof req.additions).toBe('string');
    });
  });

  describe('fetchSseAudio 解析', () => {
    it('正常解析多个音频块并拼接', async () => {
      mockFetchSse([
        `data: {"code":0,"data":"${b64('part1')}"}`,
        `data: {"code":20000000,"data":"${b64('part2')}"}`,
      ]);
      const audio = await fetchSseAudio('测试', 'voice');
      expect(audio.toString('utf8')).toBe('part1part2');
    });

    it('错误码抛异常', async () => {
      mockFetchSse(['data: {"code":40001,"message":"bad speaker"}']);
      await expect(fetchSseAudio('测试', 'bad')).rejects.toThrow('code=40001');
    });

    it('HTTP 非 200 抛异常', async () => {
      mockFetchSse([], false, 401);
      await expect(fetchSseAudio('测试', 'voice')).rejects.toThrow('HTTP');
    });

    it('无音频数据抛异常', async () => {
      mockFetchSse(['data: {"code":0,"data":""}', 'data: {"code":0}']);
      await expect(fetchSseAudio('测试', 'voice')).rejects.toThrow('no audio');
    });
  });

  describe('synthDoubaoSpeech 全流程', () => {
    it('合成成功并写入本地文件', async () => {
      mockFetchSse([`data: {"code":0,"data":"${b64('mp3-bytes')}"}`]);
      const result = await synthDoubaoSpeech('task-1', '测试旁白');
      expect(result.audioPath).toContain('.mp3');
      expect(mockedWriteFile).toHaveBeenCalled();
      // 写入的内容是拼接后的音频
      const [path, buf] = mockedWriteFile.mock.calls[0] as [string, Buffer];
      expect(buf.toString('utf8')).toBe('mp3-bytes');
      expect(path).toBe(result.audioPath);
    });
  });
});
