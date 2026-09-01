/**
 * 回忆录照片视觉摘要测试
 * 覆盖：正常提取、模型不可用降级、清洗截断与单图失败隔离。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeImage } from './visionService.js';
import { analyzeMemoirPhotos } from './memoirPhotoAnalysis.js';

vi.mock('./visionService.js', () => ({
  analyzeImage: vi.fn(),
}));

const mockedAnalyzeImage = vi.mocked(analyzeImage);

describe('memoirPhotoAnalysis 回忆录照片视觉摘要', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('按照片顺序提取可见主体、动作、场景和构图', async () => {
    mockedAnalyzeImage
      .mockResolvedValueOnce('一只橘色短毛猫蜷缩在米色沙发上，闭眼休息，室内暖光。')
      .mockResolvedValueOnce('一只橘色短毛猫坐在窗台侧望窗外，尾巴自然垂下，黄昏逆光。');

    const result = await analyzeMemoirPhotos(['https://img/1.jpg', 'https://img/2.jpg']);

    expect(result).toEqual([
      '照片1：一只橘色短毛猫蜷缩在米色沙发上，闭眼休息，室内暖光。',
      '照片2：一只橘色短毛猫坐在窗台侧望窗外，尾巴自然垂下，黄昏逆光。',
    ]);
    expect(mockedAnalyzeImage).toHaveBeenCalledTimes(2);
  });

  it('单张识别失败只降级该照片，不阻断其他照片', async () => {
    mockedAnalyzeImage
      .mockRejectedValueOnce(new Error('vision timeout'))
      .mockResolvedValueOnce('一只猫趴在木地板上。');

    const result = await analyzeMemoirPhotos(['https://img/1.jpg', 'https://img/2.jpg']);

    expect(result).toEqual(['照片1：内容未识别，请严格保持参考照片原始主体与构图。', '照片2：一只猫趴在木地板上。']);
  });

  it('清洗换行和控制字符并限制摘要长度', async () => {
    mockedAnalyzeImage.mockResolvedValue(`  橘猫\n坐在\t窗台。${'细节'.repeat(100)}  `);

    const [result] = await analyzeMemoirPhotos(['https://img/1.jpg']);

    expect(result).not.toMatch(/[\r\n\t]/);
    expect(result.length).toBeLessThanOrEqual(126);
  });
});
