/**
 * 视频内容审核服务 - 调用火山引擎内容审核 API 检查生成视频合规性
 * 供回忆录、年度回忆等视频生成模块复用
 *
 * 安全约束：
 *   - 未配置 MODERATE_API_KEY 时降级为 pass（仅限开发/测试环境，生产必须配置）
 *   - 审核异常时降级为 review（需要人工复核），不直接放行
 */
import { config } from '../config.js';
import { sanitizeError } from '../utils/sanitize.js';

export type ModerationResult = 'pass' | 'review' | 'block';

/**
 * 视频内容审核
 * @param videoUrl 待审核视频 URL
 * @returns 'pass' | 'review' | 'block'
 */
export async function moderateVideo(videoUrl: string): Promise<ModerationResult> {
  const apiKey = config.moderate?.apiKey;
  if (!apiKey) {
    console.warn('[ContentModeration] API not configured, defaulting to pass');
    return 'pass';
  }

  try {
    // 火山引擎内容审核 - 视频扫描（2026-09 审查 P1 修复：补 15s 超时，防审核 API 挂起拖死同步流程）
    const response = await fetch('https://api.volcengine.com/v2/video/scan', {
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        video_urls: [videoUrl],
        scenes: ['porn', 'terrorism', 'political', 'ad'],
      }),
    });

    if (!response.ok) {
      console.error('[ContentModeration] Moderation API error: status', response.status);
      return 'review';
    }

    const data = (await response.json()) as {
      results?: Array<{ scene: string; suggestion: ModerationResult }>;
    };

    if (!data.results || data.results.length === 0) {
      console.warn('[ContentModeration] Moderation API returned empty results, defaulting to review');
      return 'review';
    }

    const hasBlock = data.results.some((r) => r.suggestion === 'block');
    const hasReview = data.results.some((r) => r.suggestion === 'review');

    if (hasBlock) return 'block';
    if (hasReview) return 'review';
    return 'pass';
  } catch (error) {
    console.error('[ContentModeration] Moderation call failed:', sanitizeError(error));
    return 'review';
  }
}
