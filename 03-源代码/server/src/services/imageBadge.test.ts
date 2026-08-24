/**
 * AI 生图角标服务单元测试
 * mock jimp / fs / fetch，验证两条主链路：
 * 1. 成功：下载 → 等比缩放合成到右下角 → 落盘 → 返回本站 /uploads/ai-generated/xxx.png
 * 2. 失败：任一环节出错降级返回原图 URL（不抛错、不阻断生成主流程）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- hoisted mocks ----------
const { mockJimp, mockFs } = vi.hoisted(() => ({
  // jimp 默认导出只用到 read/AUTO/MIME_PNG 三个成员
  mockJimp: { read: vi.fn(), AUTO: -1, MIME_PNG: 'image/png' },
  // imageBadge 只用 fs.promises 的 mkdir/writeFile
  mockFs: { mkdir: vi.fn(), writeFile: vi.fn() },
}));

vi.mock('jimp', () => ({ default: mockJimp }));
vi.mock('fs', () => ({ promises: mockFs }));
vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    seedream: { apiKey: 'test-key' },
    meshy: { apiKey: '' },
    wechat: { appId: '', secret: '' },
    uploadDir: './uploads',
    publicBaseUrl: '',
  },
}));

import { addAiBadge } from './imageBadge.js';

/** Jimp 假图的类型声明（只声明被测代码/断言实际用到的成员） */
interface FakeJimpImage {
  /** 当前宽度/高度（resize 会改写） */
  _w: number;
  _h: number;
  getWidth(): number;
  getHeight(): number;
  clone(): FakeJimpImage;
  resize(w: number): FakeJimpImage;
  composite: ReturnType<typeof vi.fn>;
  getBufferAsync: ReturnType<typeof vi.fn>;
}

/** 构造带尺寸行为的 Jimp 假图对象：resize(w, AUTO) 按比例换算高度 */
function makeFakeImage(width: number, height: number): FakeJimpImage {
  const img: FakeJimpImage = {
    _w: width,
    _h: height,
    getWidth() { return this._w; },
    getHeight() { return this._h; },
    clone() { return makeFakeImage(width, height); },
    resize(w: number) {
      // 模拟 Jimp.resize(w, AUTO)：宽改写为 w，高按原比例换算
      const self = img;
      self._h = Math.round((self._h * w) / self._w);
      self._w = w;
      return img;
    },
    composite: vi.fn(),
    getBufferAsync: vi.fn(async () => Buffer.from('fake-png-bytes')),
  };
  return img;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFs.mkdir.mockResolvedValue(undefined);
  mockFs.writeFile.mockResolvedValue(undefined);
});

describe('addAiBadge 成功链路', () => {
  it('下载原图与角标素材，等比缩放后贴右下角，落盘并返回本站 URL', async () => {
    const base = makeFakeImage(1000, 1000);   // Seedream 1024 图按 1000 便于口算
    const badgeAsset = makeFakeImage(451, 93); // 角标素材实际尺寸
    mockJimp.read
      .mockResolvedValueOnce(base)        // 第一次 read = 下载的原图
      .mockResolvedValueOnce(badgeAsset); // 第二次 read = 角标素材（进缓存）
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await addAiBadge('https://seedream.example.com/out.png');

    // 1. fetch 了 CDN 原图（第二个参数是超时 signal 选项，只断言 URL 本身）
    expect(mockFetch.mock.calls[0][0]).toBe('https://seedream.example.com/out.png');
    // 2. 合成用的是"缩放后的克隆副本"：宽=原图 30%（300px），高度按素材比例换算（93→62）
    expect(base.composite).toHaveBeenCalledTimes(1);
    const usedBadge = base.composite.mock.calls[0][0] as { _w: number; _h: number };
    expect(usedBadge._w).toBe(300);
    expect(usedBadge._h).toBe(Math.round((93 * 300) / 451));
    // 3. 贴到右下角：留白 3% × 1000 = 30
    expect(base.composite).toHaveBeenCalledWith(usedBadge, 1000 - 300 - 30, 1000 - usedBadge._h - 30);
    // 4. 落盘到 uploads/ai-generated/{uuid}.png 并返回相对 URL
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('ai-generated'), { recursive: true });
    expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    expect(String(mockFs.writeFile.mock.calls[0][0])).toMatch(/ai-generated[\\/][0-9a-f-]{36}\.png$/);
    expect(result).toMatch(/^\/uploads\/ai-generated\/[0-9a-f-]{36}\.png$/);
  });
});

describe('addAiBadge 失败降级', () => {
  it('CDN 图片下载失败时返回原始 URL，不写盘不抛错', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const result = await addAiBadge('https://seedream.example.com/gone.png');
    expect(result).toBe('https://seedream.example.com/gone.png');
    expect(mockFs.writeFile).not.toHaveBeenCalled();
  });

  it('jimp 解码失败等异常同样降级返回原始 URL', async () => {
    mockJimp.read.mockRejectedValue(new Error('unsupported image'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }));
    const result = await addAiBadge('https://seedream.example.com/broken.png');
    expect(result).toBe('https://seedream.example.com/broken.png');
  });
});
