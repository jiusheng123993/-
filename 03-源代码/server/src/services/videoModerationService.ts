/**
 * 视频内容审核服务 - 调用火山引擎视觉智能（内容安全）API 检查生成视频合规性
 * 供回忆录、年度回忆等视频生成模块复用
 *
 * 接入说明（2026-09-09 审查⏳14 生产补 key）：
 *   - 鉴权：火山 IAM AccessKey（AKLT… 开头）+ SecretKey，经官方 SDK @volcengine/openapi
 *     的 Service 通用类做 V4 签名（serviceName='cv'，host=visual.volcengineapi.com），
 *     不得手写签名、不得使用旧 Bearer 形态（真实接口不走简单 Bearer）
 *   - Action：CVProcess（同步）；req_key（能力名，如 videorisk_detection_video）
 *     与 scenarios（审核场景）均可在 .env 覆盖——火山各能力 req_key 以控制台
 *     API Explorer 实测为准，写错时服务端返回 "req_key not supported"
 *   - 未配置密钥（开发/测试）：降级 pass，并打启动告警（config.ts 生产守卫）
 *   - 已配置但调用失败/能力未开通：降级 review（保留视频不自动分发，等人工复核），
 *     绝不 fail-open 放行——比缺 key 时代的默认 pass 更合规
 */
import { Service } from '@volcengine/openapi';
import { config } from '../config.js';
import { sanitizeError } from '../utils/sanitize.js';

export type ModerationResult = 'pass' | 'review' | 'block';

/** 审核 API 客户端（惰性创建，进程内复用） */
let svc: Service | null = null;

function getClient(): Service | null {
  const ak = config.moderate?.accessKeyId;
  const sk = config.moderate?.secretAccessKey;
  if (!ak || !sk) {
    console.warn('[ContentModeration] API not configured, defaulting to pass');
    return null;
  }
  if (!svc) {
    svc = new Service({
      serviceName: 'cv',
      region: 'cn-north-1',
      host: 'visual.volcengineapi.com',
      accessKeyId: ak,
      secretKey: sk,
    });
  }
  return svc;
}

/**
 * 视频内容审核
 * @param videoUrl 待审核视频 URL
 * @returns 'pass' | 'review' | 'block'
 */
export async function moderateVideo(videoUrl: string): Promise<ModerationResult> {
  const client = getClient();
  if (!client) {
    return 'pass';
  }

  try {
    const reqKey = config.moderate?.reqKey || 'videorisk_detection_video';
    const scenarios = config.moderate?.scenarios || ['porn', 'politician', 'terror', 'ad'];

    // 火山视觉智能内容安全：视频审核（CVProcess 同步；能力名 req_key 可经 .env 校准）
    const res = (await client.createJSONAPI('CVProcess', {
      Version: '2022-08-31',
      method: 'POST',
    })({
      req_key: reqKey,
      video_urls: [videoUrl],
      scenarios,
    })) as {
      code?: number;
      status?: number;
      message?: string;
      data?: {
        resp?: {
          results?: Array<{ scene?: string; suggestion?: string; risk?: boolean; label?: string }>;
          data?: Array<{ results?: Array<{ suggestion?: string }> }>;
        } | null;
      } | null;
    };

    // 服务端业务错误（如 req_key 能力未开通/写错、参数不支持）
    if (res.code && res.code !== 10000) {
      console.error(
        `[ContentModeration] Moderation API error: code=${res.code}, message=${String(res.message || '').slice(0, 120)}`,
      );
      return 'review';
    }

    // 解析审核建议：优先 resp.results[].suggestion（pass/review/block），兼容 data[].results
    const suggestions: string[] = [];
    for (const r of res.data?.resp?.results ?? []) {
      if (r?.suggestion) suggestions.push(r.suggestion);
    }
    for (const d of res.data?.resp?.data ?? []) {
      for (const r of d?.results ?? []) {
        if (r?.suggestion) suggestions.push(r.suggestion);
      }
    }

    if (suggestions.length === 0) {
      console.warn('[ContentModeration] Moderation API returned empty results, defaulting to review');
      return 'review';
    }

    if (suggestions.some((s) => s === 'block')) return 'block';
    if (suggestions.some((s) => s === 'review')) return 'review';
    return 'pass';
  } catch (error) {
    console.error('[ContentModeration] Moderation call failed:', sanitizeError(error));
    return 'review';
  }
}
