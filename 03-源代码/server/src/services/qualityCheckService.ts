/**
 * 回忆录视频质量质检服务（回忆录 2.0 M5 模块）
 * 职责：生成完成后抽帧，用 DeepSeek 视觉模型（deepseek-v4-flash-vision-exp）评分，
 * 不合格段自动标记重做，防止"明显翻车"视频交付给用户。
 *
 * 设计：
 * - 抽帧：ffmpeg 从视频中抽 5 帧（首/1/4/2/3/4/尾），压缩为 JPEG data URL 传给视觉模型
 * - 评分维度：清晰度(clarity)/主体一致性(consistency)/提示词匹配(match)/瑕疵(defects)
 * - 任一帧"重大瑕疵"或"一致性 < 6 分" → 整段不合格
 * - 质检服务不可用（无 key/网络失败）→ 降级为"放行"（degraded=true，不阻断业务）
 *
 * 成本：每帧约 1000-2000 token（720p 图片），5 帧 ≈ 0.01-0.02 元，可忽略
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

/** 抽帧数量 */
const FRAME_COUNT = 5;

/** 及格分数线（0-10） */
const MIN_CLARITY = 6;
const MIN_CONSISTENCY = 6;

/** 质检结果 */
export interface QualityResult {
  /** 是否通过（false=需重做） */
  passed: boolean;
  /** 各维度均分（0-10） */
  score: { clarity: number; consistency: number; match: number };
  /** 检查的帧数 */
  framesChecked: number;
  /** 发现的问题描述 */
  defects: string[];
  /** 质检服务不可用时 true（业务方应放行） */
  degraded: boolean;
}

/** 质检参数 */
export interface QualityCheckParams {
  /** 本地视频文件路径 */
  videoPath: string;
  /** 参考照片 URL（身份一致性对比；可为空） */
  referencePhotoUrl?: string;
  /** 身份锚点描述（供模型判断"是不是同一只宠物"） */
  identityAnchor?: string;
}

/** 视觉模型单帧评分结果 */
interface FrameScore {
  clarity: number;
  consistency: number;
  match: number;
  defects: string[];
  pass: boolean;
}

/** 临时工作目录 */
function qualityWorkDir(taskId: string): string {
  return path.join(os.tmpdir(), 'memoir-quality', taskId);
}

/**
 * 从视频抽取指定时间的帧（压缩为 JPEG，供视觉模型 base64 传输）
 * @param videoPath - 视频路径
 * @param timeSec - 抽帧时间（秒）
 * @param outPath - 输出 jpg 路径
 */
async function extractFrame(videoPath: string, timeSec: number, outPath: string): Promise<void> {
  await execFileAsync(
    'ffmpeg',
    [
      '-y',
      '-ss', String(timeSec),
      '-i', videoPath,
      '-frames:v', '1',
      '-q:v', '5', // JPEG 质量（控制 base64 体积）
      outPath,
    ],
    { timeout: 30_000 },
  );
}

/**
 * 计算抽帧时间点（首/尾 + 均匀分布）
 * @param durationSec - 视频时长
 * @returns 时间点数组（秒）
 */
export function frameTimes(durationSec: number): number[] {
  if (durationSec <= 0) return [0];
  const count = Math.min(FRAME_COUNT, Math.max(2, Math.ceil(durationSec)));
  if (count === 1) return [0];
  const times: number[] = [];
  for (let i = 0; i < count; i++) {
    times.push(Math.min(durationSec - 0.1, (durationSec / count) * (i + 0.5)));
  }
  return times;
}

/**
 * 构建质检系统提示词（要求模型只返回 JSON 评分）
 * @param identityAnchor - 身份锚点（可选）
 * @returns 系统提示词
 */
export function buildQualityPrompt(identityAnchor?: string): string {
  return `你是视频质量质检员。检查这张从宠物回忆录视频中抽出的帧，输出 JSON 评分：
{
  "clarity": <0-10 画面清晰度，模糊/花屏/压缩严重<6>,
  "consistency": <0-10 与参考宠物的一致性：毛色/体型/五官是否一致，出现第二只宠物/镜面倒影<4>,
  "match": <0-10 与画面描述（运镜/光线/氛围）匹配度>,
  "defects": ["明显瑕疵描述，如多腿/变形/文字乱码/主体怪异；无则空数组"],
  "pass": <true/false 是否合格>
}
评分规则：重大瑕疵（多肢体/面部扭曲/多余宠物/乱码文字）或一致性<6 → pass=false。
${identityAnchor ? `参考宠物特征（身份锚点）：${identityAnchor}` : '无参考特征，仅检查画面质量。'}
只输出 JSON，不要其他文字。`;
}

/**
 * 调用视觉模型检查单帧
 * @param framePath - 帧图片路径（本地）
 * @param referencePhotoUrl - 参考照片 URL（可选）
 * @param identityAnchor - 身份锚点（可选）
 * @returns 评分结果（解析失败视为不通过并标记 degraded 由上层处理）
 */
async function checkFrame(
  framePath: string,
  referencePhotoUrl: string | undefined,
  identityAnchor: string | undefined,
): Promise<{ score: FrameScore; error?: string }> {
  // 质检 key：优先独立配置 QUALITY_CHECK_API_KEY，缺省复用主 AI key
  // 注意：baseUrl/model 固定为 DeepSeek 官方视觉（config.qualityCheck），
  // 若主 key 是火山方舟（ark-）会 401 → 触发降级并打日志（不静默放行）
  const apiKey = config.qualityCheck.apiKey || config.ai.apiKey;
  if (!apiKey) {
    console.warn('[QualityCheck] 未配置质检 key（QUALITY_CHECK_API_KEY 或主 AI key），质检降级放行');
    return { score: { clarity: 0, consistency: 0, match: 0, defects: [], pass: true }, error: 'no-api-key' };
  }

  // 帧图片 → base64 data URL
  const frameBuf = await readFile(framePath);
  const frameDataUrl = `data:image/jpeg;base64,${frameBuf.toString('base64')}`;

  // 参考照片也转 data URL（如果本地文件）或直接传 URL
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: '请检查这一帧的画面质量。' },
    { type: 'image_url', image_url: { url: frameDataUrl } },
  ];
  if (referencePhotoUrl) {
    userContent.push({
      type: 'text',
      text: `参考宠物照片（对比一致性用）：${referencePhotoUrl}`,
    });
  }

  const response = await fetch(`${config.qualityCheck.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.qualityCheck.model,
      messages: [
        { role: 'system', content: buildQualityPrompt(identityAnchor) },
        { role: 'user', content: userContent },
      ],
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`Quality check API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  // 提取 JSON（兼容 markdown 包裹）
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Quality check response is not JSON');
  }
  const parsed = JSON.parse(content.slice(start, end + 1)) as Partial<FrameScore>;

  return {
    score: {
      clarity: clampScore(parsed.clarity),
      consistency: clampScore(parsed.consistency),
      match: clampScore(parsed.match),
      defects: Array.isArray(parsed.defects) ? parsed.defects : [],
      pass: parsed.pass === true,
    },
  };
}

/** 分数 clamp 到 0-10 */
function clampScore(v: unknown): number {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n)));
}

/**
 * 质检主入口：抽帧 → 并行评分 → 汇总判定
 * @param params - 质检参数
 * @returns 质检结果
 */
export async function checkVideoQuality(params: QualityCheckParams): Promise<QualityResult> {
  const { videoPath, referencePhotoUrl, identityAnchor } = params;

  // 获取视频时长（ffprobe）
  let durationSec = 10;
  try {
    const probe = await execFileAsync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', videoPath],
      { timeout: 15_000 },
    );
    const parsed = parseFloat(probe.stdout.trim());
    if (!Number.isNaN(parsed) && parsed > 0) durationSec = parsed;
  } catch {
    // ffprobe 失败用默认时长
  }

  // 质检工作目录：用视频所在目录名（taskId）隔离并发任务
  // 坑点：不能用 basename(videoPath)（恒为 final.mp4），否则并发任务帧互相覆盖
  const workDir = qualityWorkDir(path.basename(path.dirname(videoPath)) || path.basename(videoPath));
  await mkdir(workDir, { recursive: true });

  try {
    // 1. 抽帧
    const times = frameTimes(durationSec);
    const framePaths: string[] = [];
    for (let i = 0; i < times.length; i++) {
      const framePath = path.join(workDir, `frame_${i}.jpg`);
      await extractFrame(videoPath, times[i], framePath);
      framePaths.push(framePath);
    }

    // 2. 并行评分（任一帧失败整段视为"需人工复核"，但 degraded=false 时严格失败）
    const results = await Promise.all(
      framePaths.map((fp) =>
        checkFrame(fp, referencePhotoUrl, identityAnchor).catch((err) => ({
          score: { clarity: 0, consistency: 0, match: 0, defects: [`质检调用失败: ${(err as Error).message}`], pass: false },
          error: (err as Error).message,
        })),
      ),
    );

    // 3. 汇总
    const allDefects = results.flatMap((r) => r.score.defects);
    const avg = (key: 'clarity' | 'consistency' | 'match') =>
      Math.round(results.reduce((sum, r) => sum + r.score[key], 0) / results.length);

    const anyHardFail = results.some((r) => !r.score.pass);
    const avgClarity = avg('clarity');
    const avgConsistency = avg('consistency');

    // 有 API 调用失败 → 降级放行（质检服务不稳定不应阻断业务，passed 置 true；打日志避免静默）
    const anyError = results.some((r) => r.error);
    if (anyError) {
      console.warn(`[QualityCheck] 质检调用失败降级放行: ${results.filter((r) => r.error).map((r) => r.error).join('; ')}`);
    }
    const passed = anyError
      ? true
      : !anyHardFail && avgClarity >= MIN_CLARITY && avgConsistency >= MIN_CONSISTENCY;

    return {
      passed,
      score: { clarity: avgClarity, consistency: avgConsistency, match: avg('match') },
      framesChecked: framePaths.length,
      defects: allDefects,
      degraded: anyError,
    };
  } finally {
    // 清理抽帧临时文件
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

// 导出内部函数供单测覆盖（buildQualityPrompt 已为顶层导出，不再重复）
export { extractFrame, qualityWorkDir };
