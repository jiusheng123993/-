/**
 * 回忆录照片视觉摘要服务
 *
 * 在生成分镜前逐张理解用户照片，把“谁、在哪、在做什么、构图与光线”提供给编剧模型，
 * 避免分镜只根据档案猜测照片内容。识别失败按单图降级，不阻断整条回忆录任务。
 */
import { analyzeImage } from './visionService.js';

/** 单张摘要最大长度，避免 8-15 张照片撑爆分镜模型上下文。 */
const MAX_DESCRIPTION_LENGTH = 120;
/** 同时识别的照片数，限制视觉 API 瞬时并发。 */
const ANALYSIS_CONCURRENCY = 3;
/** 单图识别失败时写入的保守指令。 */
const FALLBACK_DESCRIPTION = '内容未识别，请严格保持参考照片原始主体与构图。';

/**
 * 清洗视觉模型返回文本。
 * @param raw - 视觉模型原始回复
 * @returns 单行、限长的照片摘要；空回复返回降级描述
 */
function cleanPhotoDescription(raw: string | null): string {
  const cleaned = (raw || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return cleaned ? cleaned.slice(0, MAX_DESCRIPTION_LENGTH) : FALLBACK_DESCRIPTION;
}

/**
 * 识别单张回忆录照片。
 * @param imageUrl - 用户照片 URL
 * @param index - 照片在回忆录中的零基下标
 * @returns 带“照片N”前缀的可见事实摘要
 */
async function analyzeOnePhoto(imageUrl: string, index: number): Promise<string> {
  try {
    const raw = await analyzeImage({
      imageUrl,
      prompt:
        '你是宠物回忆录分镜观察员。只描述照片中确实可见的事实，用一条中文短句输出。' +
        '依次包含：在场主体及数量、宠物毛色花纹和显著特征、身体姿态与视线、人与宠物的可见互动、场景与关键道具、景别构图、主要光线。' +
        '禁止猜测宠物名字、关系、时间、地点和照片外发生的事情；禁止写情绪形容词、建议、标题或列表；控制在80字以内。',
      maxTokens: 220,
    });
    return `照片${index + 1}：${cleanPhotoDescription(raw)}`;
  } catch (error) {
    // 单图失败不应让整条付费视频任务失败，记录不含 URL 的脱敏告警后保守降级。
    console.warn(`[MemoirPhotoAnalysis] 照片${index + 1}识别失败，使用保守描述:`, (error as Error).message);
    return `照片${index + 1}：${FALLBACK_DESCRIPTION}`;
  }
}

/**
 * 批量提取回忆录照片视觉摘要。
 * @param imageUrls - 按视频时间顺序排列的照片 URL
 * @returns 与输入顺序严格一致的摘要数组
 */
export async function analyzeMemoirPhotos(imageUrls: string[]): Promise<string[]> {
  const results = new Array<string>(imageUrls.length);
  let nextIndex = 0;

  /** 每个 worker 顺序领取下一张照片，兼顾顺序稳定与有限并发。 */
  async function worker(): Promise<void> {
    while (nextIndex < imageUrls.length) {
      const index = nextIndex++;
      results[index] = await analyzeOnePhoto(imageUrls[index], index);
    }
  }

  const workerCount = Math.min(ANALYSIS_CONCURRENCY, imageUrls.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export { cleanPhotoDescription, FALLBACK_DESCRIPTION, MAX_DESCRIPTION_LENGTH };
