/**
 * 火山引擎豆包语音（Doubao Speech 2.0）TTS provider（回忆录 2.0 M3 模块）
 * 职责：调用火山引擎豆包语音合成接口，将文本转为本地音频文件
 *
 * API 依据：字节官方 agentkit byted-text-to-speech（2026-08 实测确认）
 * - 端点：POST https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse（SSE 单向流式）
 *   ※ seed-tts-2.0 仅支持 SSE 流式接口，submit/query 异步接口会报
 *     "resource ID is mismatched with speaker related resource"
 * - 鉴权：X-Api-Key（新版控制台 API Key）+ X-Api-Resource-Id: seed-tts-2.0
 * - 响应：SSE 行 data: {json}，data 字段为 base64 音频块，code 0/20000000 表示成功
 *
 * 安全：
 * - API Key 只从 config 读取，禁止硬编码/打印
 * - 失败抛错由上层降级（仅字幕）
 */
import { writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

/** 临时工作目录 */
function workDir(taskId: string): string {
  return path.join(os.tmpdir(), 'memoir-doubao', taskId);
}

/** 单镜合成结果 */
export interface DoubaoSynthResult {
  /** 本地音频文件路径 */
  audioPath: string;
}

/**
 * 构造 SSE 流式合成端点
 * 端点 = config.doubaoSpeech.baseUrl（默认 https://openspeech.bytedance.com/api/v3/tts）+ /unidirectional/sse
 * @returns 完整端点 URL
 */
export function sseEndpoint(): string {
  return `${config.doubaoSpeech.baseUrl.replace(/\/+$/, '')}/unidirectional/sse`;
}

/**
 * 构建 SSE 请求体（对齐字节官方 agentkit）
 * @param text - 合成文本
 * @param speaker - 音色 ID
 * @returns 请求体 JSON
 */
export function buildSseBody(text: string, speaker: string): Record<string, unknown> {
  return {
    user: { uid: 'xinghechongji_memoir' },
    req_params: {
      text,
      speaker,
      sample_rate: 24000,
      audio_params: {
        format: 'mp3',
        speech_rate: 0, // 正常语速
        loudness_rate: 0,
        bit_rate: 64000,
      },
      additions: JSON.stringify({
        post_process: { pitch: 0 },
        disable_markdown_filter: true,
        enable_latex_tn: true,
        latex_parser: 'v2',
      }),
    },
  };
}

/**
 * 调用豆包语音 SSE 接口，收集音频块
 * @param text - 合成文本
 * @param speaker - 音色 ID
 * @returns 音频 Buffer（base64 解码拼接）
 */
export async function fetchSseAudio(text: string, speaker: string): Promise<Buffer> {
  const apiKey = config.doubaoSpeech.apiKey;
  const resourceId = config.doubaoSpeech.resourceId;

  const response = await fetch(sseEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
      'X-Api-Resource-Id': resourceId,
      'X-Api-Request-Id': randomUUID(),
    },
    body: JSON.stringify(buildSseBody(text, speaker)),
    // SSE 流超时保护：60 秒无响应/未完成则中止，防止任务永久卡 processing
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Doubao TTS HTTP error: ${response.status}`);
  }

  // 逐行读取 SSE 流，解析 data: {json} 中的 base64 音频块
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: Buffer[] = [];
  let buffer = '';
  let sawAudio = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 按行切分 SSE 事件
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (!line.startsWith('data:')) continue;

      try {
        const data = JSON.parse(line.slice(5).trim()) as {
          code?: number;
          message?: string;
          data?: string;
        };
        // code 0 / 20000000 表示正常（含音频块）
        if (data.code && data.code !== 0 && data.code !== 20000000) {
          throw new Error(`Doubao TTS SSE error code=${data.code}: ${data.message || ''}`);
        }
        if (data.data) {
          sawAudio = true;
          chunks.push(Buffer.from(data.data, 'base64'));
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('SSE error')) throw err;
        // 忽略无法解析的行（保持健壮）
      }
    }
  }

  if (!sawAudio || chunks.length === 0) {
    throw new Error('Doubao TTS returned no audio data');
  }

  return Buffer.concat(chunks);
}

/**
 * 合成单段旁白音频（豆包语音 SSE 流式）
 * @param taskId - 回忆录任务 ID（工作目录隔离）
 * @param text - 旁白文本
 * @param voice - 音色（可覆盖默认）
 * @returns 本地音频路径
 */
export async function synthDoubaoSpeech(
  taskId: string,
  text: string,
  voice?: string,
): Promise<DoubaoSynthResult> {
  const dir = workDir(taskId);
  const outPath = path.join(dir, `nar_${Date.now()}.mp3`);

  const audio = await fetchSseAudio(text, voice ?? config.doubaoSpeech.voice);
  await writeFile(outPath, audio);

  return { audioPath: outPath };
}

/**
 * 清理豆包语音临时文件（任务完成后调用）
 * @param taskId - 回忆录任务 ID
 */
export async function cleanupDoubaoSpeech(taskId: string): Promise<void> {
  await rm(workDir(taskId), { recursive: true, force: true }).catch(() => {});
}

// 导出内部函数供单测覆盖（sseEndpoint 已为顶层导出，不重复）
export { workDir };
