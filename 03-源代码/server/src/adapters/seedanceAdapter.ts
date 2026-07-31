/**
 * Seedance 视频生成适配器
 * 封装火山方舟（Volcengine Ark）视频生成 API 的调用
 * 接口文档：https://www.volcengine.com/docs/82379/1520757
 *
 * 能力范围：
 *   - 创建视频生成任务（图生视频-首帧）：POST /api/v3/contents/generations/tasks
 *   - 查询任务状态：GET /api/v3/contents/generations/tasks/{id}
 *
 * 异步模型：
 *   视频生成是异步任务，提交后返回任务 ID，需轮询查询接口获取结果。
 *   本适配器提供 createVideoGenerationTask 与 queryVideoTask 两个原子方法，
 *   由上层服务（videoGenerationService）编排轮询逻辑。
 *
 * 安全约束：
 *   - API Key 从环境变量读取，禁止硬编码
 *   - 错误信息脱敏返回，不泄露内部堆栈
 */
import { config } from '../config.js';

/** Seedance 模型 ID（默认 Seedance 1.5 Pro，可通过环境变量覆盖） */
const DEFAULT_MODEL = 'doubao-seedance-1-5-pro-251215';

/** 视频生成 API 基础地址 */
const API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

/** 视频生成任务状态枚举 */
export type SeedanceTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/** 创建视频生成任务的请求参数 */
export interface SeedanceGenerateParams {
  /** 首帧图片 URL（图生视频-首帧） */
  imageUrl: string;
  /** 文本提示词（描述期望的动效，可选） */
  prompt?: string;
  /** 视频时长（秒），Seedance 单段建议 3-8 秒 */
  duration?: number;
  /** 宽高比，默认按图片自适应 */
  ratio?: string;
  /** 是否包含水印，默认 true */
  watermark?: boolean;
  /** 生成的分辨率，默认 720p */
  resolution?: '480p' | '720p' | '1080p';
}

/** 创建视频生成任务的响应 */
export interface SeedanceCreateResult {
  /** 任务 ID */
  taskId: string | null;
  /** 创建失败时的错误信息 */
  error: string | null;
}

/** 查询视频任务的结果 */
export interface SeedanceQueryResult {
  status: SeedanceTaskStatus | null;
  /** 生成成功的视频 URL */
  videoUrl: string | null;
  /** 任务失败原因 */
  error: string | null;
}

/**
 * 创建视频生成任务
 * 使用图生视频-首帧模式：传入首帧图片 + 文本提示词，生成一段动效视频
 */
export async function createVideoGenerationTask(
  params: SeedanceGenerateParams,
): Promise<SeedanceCreateResult> {
  const apiKey = config.seedance.apiKey || config.seedream.apiKey;
  if (!apiKey) {
    return { taskId: null, error: 'SEEDANCE_API_KEY not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.seedance.model || DEFAULT_MODEL,
        content: [
          ...(params.prompt
            ? [{ type: 'text' as const, text: params.prompt }]
            : []),
          {
            type: 'image_url' as const,
            image_url: { url: params.imageUrl },
          },
        ],
        ...(params.duration ? { duration: params.duration } : {}),
        ...(params.ratio ? { ratio: params.ratio } : {}),
        ...(params.watermark !== undefined ? { watermark: params.watermark } : {}),
        ...(params.resolution ? { resolution: params.resolution } : {}),
      }),
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      return { taskId: null, error: `Seedance API error: ${response.status} ${statusText}` };
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      return { taskId: null, error: 'Seedance API returned empty task id' };
    }

    return { taskId: data.id, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { taskId: null, error: `Seedance API call failed: ${message}` };
  }
}

/**
 * 查询视频生成任务状态
 * @param taskId - 创建任务时返回的任务 ID
 */
export async function queryVideoTask(taskId: string): Promise<SeedanceQueryResult> {
  const apiKey = config.seedance.apiKey || config.seedream.apiKey;
  if (!apiKey) {
    return { status: null, videoUrl: null, error: 'SEEDANCE_API_KEY not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/contents/generations/tasks/${encodeURIComponent(taskId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      return { status: null, videoUrl: null, error: `Seedance query error: ${response.status} ${statusText}` };
    }

    const data = (await response.json()) as {
      status?: SeedanceTaskStatus;
      content?: { video_url?: string };
      error?: { code?: string; message?: string };
    };

    if (data.status === 'failed') {
      return {
        status: data.status,
        videoUrl: null,
        error: data.error?.message || 'Seedance task failed',
      };
    }

    return {
      status: data.status ?? null,
      videoUrl: data.status === 'succeeded' ? data.content?.video_url ?? null : null,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { status: null, videoUrl: null, error: `Seedance query failed: ${message}` };
  }
}

/**
 * 判断 Seedance 视频生成服务是否已配置
 */
export function isSeedanceConfigured(): boolean {
  return Boolean(config.seedance.apiKey || config.seedream.apiKey);
}
