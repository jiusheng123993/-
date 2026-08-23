/**
 * 回忆录旁白 TTS 服务（回忆录 2.0 M3 模块，火山豆包语音版）
 * 职责：把分镜脚本的旁白文案合成为整段旁白音频（火山引擎豆包语音），供 ffmpeg 混音
 *
 * 实现（2026-08-22 从 edge-tts 切换为火山豆包语音，原因：edge-tts 非官方接口/合规风险）：
 * - 每镜旁白单独调豆包语音（synthDoubaoSpeech）合成 mp3
 * - 按视频时间轴用 ffmpeg adelay + amix 拼接为整段旁白
 * - 未配置 DOUBAO_SPEECH_API_KEY 时自动降级（返回 degraded，由调用方只保留字幕）
 *
 * 安全：
 * - 旁白文案经 execFile 参数数组传递，无 shell 注入
 * - 临时文件用完即删
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { config } from '../config.js';
import { synthDoubaoSpeech } from './doubaoSpeechTts.js';

const execFileAsync = promisify(execFile);

/** 单条旁白（按时间轴拼接用） */
export interface NarrationSegment {
  /** 旁白文案 */
  text: string;
  /** 该旁白在视频中的起始时间（秒） */
  startSec: number;
  /** 该旁白在视频中的结束时间（秒） */
  endSec: number;
}

/** TTS 合成结果 */
export interface TtsResult {
  /** 旁白音频文件路径（待混音） */
  audioPath: string;
  /** 是否使用了降级（true=无旁白，调用方应只保留字幕） */
  degraded: boolean;
  /** 旁白总时长（秒；0 表示未知/降级） */
  durationSec: number;
}

/** 临时工作目录（存中间音频） */
function ttsWorkDir(taskId: string): string {
  return path.join(os.tmpdir(), 'memoir-tts', taskId);
}

/**
 * 合成整段旁白（逐镜旁白按时间轴拼接）
 * 实现：每镜旁白单独调豆包语音合成 mp3 → ffmpeg 先裁后延（atrim→asetpts→adelay）→ amix 混合
 * 降级：未配置豆包 key 或合成失败时返回 degraded（无旁白，仅字幕）
 * @param taskId - 任务 ID（工作目录隔离）
 * @param segments - 旁白片段列表（含时间轴）
 * @param voice - 音色偏好（可选，覆盖 config 默认；对应分镜的 narration_voice）
 * @returns TTS 合成结果
 */
export async function synthNarration(
  taskId: string,
  segments: NarrationSegment[],
  voice?: string,
): Promise<TtsResult> {
  const usable = segments.filter((seg) => seg.text && seg.text.trim().length >= 2);
  if (usable.length === 0) {
    return { audioPath: '', degraded: true, durationSec: 0 };
  }

  // 未配置豆包语音 key → 降级（无旁白，保留字幕）
  if (!config.doubaoSpeech.apiKey) {
    console.warn('[TTS] DOUBAO_SPEECH_API_KEY 未配置，旁白降级为仅字幕');
    return { audioPath: '', degraded: true, durationSec: 0 };
  }

  const workDir = ttsWorkDir(taskId);
  await mkdir(workDir, { recursive: true });

  try {
    // 1. 逐镜合成旁白 mp3（豆包语音，音色可覆盖）
    const clips: string[] = [];
    for (let i = 0; i < usable.length; i++) {
      const result = await synthDoubaoSpeech(taskId, usable[i].text, voice);
      clips.push(result.audioPath);
    }

    // 2. 用 ffmpeg 把每段旁白对齐到时间轴再混合为一条
    //    正确顺序：先 atrim 裁到本镜时长（单位=秒！ffmpeg atrim 的 start/end 是秒），
    //    再 asetpts 归零、再 adelay 平移到本镜起始。若先 adelay 后 atrim，
    //    PTS 已被平移会把非首镜旁白整段裁掉。
    const durSec = usable.map((seg) => Math.max(0.5, seg.endSec - seg.startSec));
    const delayMs = usable.map((seg) => Math.round(seg.startSec * 1000));
    const inputs: string[] = [];
    const filterParts: string[] = [];
    clips.forEach((clip, i) => {
      inputs.push('-i', clip);
      filterParts.push(
        `[${i}:a]atrim=start=0:end=${durSec[i].toFixed(2)},asetpts=PTS-STARTPTS,` +
          `adelay=${delayMs[i]}|${delayMs[i]},volume=1.0[aud${i}]`,
      );
    });
    const mixInputs = usable.map((_, i) => `[aud${i}]`).join('');
    const finalFilter = filterParts.join(';') + `;${mixInputs}amix=inputs=${usable.length}:normalize=0[aout]`;

    const outPath = path.join(workDir, 'narration.mp3');
    await execFileAsync(
      'ffmpeg',
      ['-y', ...inputs, '-filter_complex', finalFilter, '-map', '[aout]', '-c:a', 'libmp3lame', outPath],
      { timeout: 120_000 },
    );

    // 3. 清理单镜 clip（保留 narration.mp3 供混音）
    for (const clip of clips) {
      await rm(clip, { force: true }).catch(() => {});
    }

    return { audioPath: outPath, degraded: false, durationSec: 0 };
  } catch (err) {
    // 合成失败 → 降级（清理临时文件）
    console.warn('[TTS] 旁白合成失败，降级为仅字幕:', (err as Error).message);
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    return { audioPath: '', degraded: true, durationSec: 0 };
  }
}

/**
 * 清理 TTS 工作目录（任务完成后调用）
 * @param taskId - 任务 ID
 */
export async function cleanupNarration(taskId: string): Promise<void> {
  await rm(ttsWorkDir(taskId), { recursive: true, force: true }).catch(() => {});
}

// 导出内部函数供单测覆盖
export { ttsWorkDir };
