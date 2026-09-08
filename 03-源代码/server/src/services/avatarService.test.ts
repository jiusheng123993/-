/**
 * 宠物形象多风格候选服务单元测试
 * 重点验证"文字描述生成"链路：用户描述清洗（去换行/截断）后拼进每个画风的提示词
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallSeedream = vi.hoisted(() => vi.fn());
const mockAnalyzeImage = vi.hoisted(() => vi.fn());

vi.mock('../config.js', () => ({
  config: {
    seedream: { apiKey: 'test-key' },
    meshy: { apiKey: '' },
  },
}));

vi.mock('./image2DService.js', () => ({
  callSeedream: mockCallSeedream,
}));

vi.mock('./visionService.js', () => ({
  analyzeImage: mockAnalyzeImage,
}));

import { generatePetImageOptions, generateBackgroundSwap, extractPetAppearance } from './avatarService.js';

/** 从 mock 调用里按类型拆分提示词：头像调用含"的头像"，设定图调用含"角色设定图" */
function splitCalls(): { headPrompts: string[]; sheetPrompts: string[] } {
  const headPrompts: string[] = [];
  const sheetPrompts: string[] = [];
  for (const call of mockCallSeedream.mock.calls) {
    const prompt = call[0] as string;
    if (prompt.includes('角色设定图')) sheetPrompts.push(prompt);
    else headPrompts.push(prompt);
  }
  return { headPrompts, sheetPrompts };
}

describe('generatePetImageOptions 一套两张（头像 + 全方位设定图）', () => {
  beforeEach(() => {
    mockCallSeedream.mockReset();
    mockCallSeedream.mockResolvedValue('https://cdn.example.com/avatar.png');
  });

  it('文字生成（无参考图）只出头像：1 次调用，sheetUrl=null（设定图为照片流程专属）', async () => {
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
    });
    expect(options).not.toBeNull();
    expect(options).toHaveLength(1);
    expect(options![0].style).toBe('q');
    // 只出头像：无参考图时四视图全靠想象，作为角色参考价值低还翻倍成本
    expect(mockCallSeedream).toHaveBeenCalledTimes(1);
    const { headPrompts, sheetPrompts } = splitCalls();
    expect(headPrompts).toHaveLength(1);
    expect(sheetPrompts).toHaveLength(0);
    expect(options![0].url).toBe('https://cdn.example.com/avatar.png');
    expect(options![0].sheetUrl).toBeNull();
  });

  it('有描述时拼进头像提示词（清洗换行/截断 100 字），名字不进 prompt', async () => {
    await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
      description: `圆脸胖乎乎的\n很粘人${'长'.repeat(200)}`,
    });
    const { headPrompts } = splitCalls();
    // 换行被清洗成空格，描述被截断到 100 字（'圆脸胖乎乎的 很粘人' + 长字）
    expect(headPrompts[0]).toContain('圆脸胖乎乎的 很粘人');
    expect(headPrompts[0]).not.toContain('\n');
    expect(headPrompts[0]).toContain('一只英短猫咪的头像');
    // 名字绝不进提示词
    expect(headPrompts[0]).not.toContain('烧鸡');
  });

  it('背景 key 拼进头像提示词替换"干净背景"（文生图换景）；非法/未选回退默认', async () => {
    // 选了樱花背景：场景描写替换干净背景
    await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
      background: 'sakura',
    });
    const first = splitCalls().headPrompts[0];
    expect(first).toContain('春日樱花树下粉色花瓣飘落的背景');
    expect(first).not.toContain('干净背景');
    // 非法 key（路由白名单漏网兜底）：回退默认干净背景
    mockCallSeedream.mockClear();
    await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
      background: 'hacker-injection',
    });
    expect(splitCalls().headPrompts[0]).toContain('干净背景');
  });

  it('真·背景替换：以源形象为参考图，保角色锁定 + 只换景；非法背景不发请求', async () => {
    mockCallSeedream.mockResolvedValue('https://cdn.example.com/swapped.png');
    const url = await generateBackgroundSwap({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      imageUrl: 'https://e.com/source.png',
      background: 'christmas',
    });
    expect(url).toBe('https://cdn.example.com/swapped.png');
    expect(mockCallSeedream).toHaveBeenCalledTimes(1);
    const [prompt, reference] = mockCallSeedream.mock.calls[0];
    // 参考图 = 用户选定的源形象（图生图身份锚点）
    expect(reference).toBe('https://e.com/source.png');
    // 角色锁定（金科玉律 #4：有参考图才写"以...为准"）+ 数量锁定 + 仅换景
    expect(prompt).toContain('一只英短猫咪的照片为准');
    expect(prompt).toContain('不改变外貌，不增减数量');
    expect(prompt).toContain('仅将背景更换为：圣诞壁炉、彩灯与松枝装饰的温暖背景');
    expect(prompt).toContain('只出现这一只宠物');
    // 名字绝不进提示词
    expect(prompt).not.toContain('烧鸡');

    // 非法背景 key：不发请求返回 null（路由白名单漏网的双保险）
    mockCallSeedream.mockClear();
    const bad = await generateBackgroundSwap({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      imageUrl: 'https://e.com/source.png',
      background: '<script>',
    });
    expect(bad).toBeNull();
    expect(mockCallSeedream).not.toHaveBeenCalled();
  });

  it('真·背景替换：自定义描述清洗截断 60 字进提示词，且优先于预设；两者皆空不发请求', async () => {
    mockCallSeedream.mockResolvedValue('https://cdn.example.com/custom-bg.png');
    // 自定义 + 换行 + 超长：清洗为单行空格、截断 60 字，并覆盖预设
    await generateBackgroundSwap({
      petId: 'p1',
      species: 'dog',
      breed: '金毛',
      imageUrl: 'https://e.com/source.png',
      background: 'sakura',
      customBackground: `铺满落叶的秋日森林小径\n午后暖阳${'景'.repeat(100)}`,
    });
    const [prompt, reference] = mockCallSeedream.mock.calls[0];
    expect(prompt).toContain('仅将背景更换为：铺满落叶的秋日森林小径 午后暖阳');
    expect(prompt).not.toContain('\n');
    expect(prompt).not.toContain('春日樱花树下'); // 自定义优先，预设被覆盖
    expect(reference).toBe('https://e.com/source.png');

    // 两者皆空（自定义纯空白 + 无预设）：不发请求
    mockCallSeedream.mockClear();
    const empty = await generateBackgroundSwap({
      petId: 'p1',
      species: 'dog',
      breed: '金毛',
      imageUrl: 'https://e.com/source.png',
      customBackground: '   \n\t ',
    });
    expect(empty).toBeNull();
    expect(mockCallSeedream).not.toHaveBeenCalled();
  });

  it('设定图提示词含四视图版式与"同一只"主体锁定（防画成四只宠物）', async () => {
    await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
      photoUrl: 'https://e.com/photo.jpg',
    });
    const { sheetPrompts } = splitCalls();
    expect(sheetPrompts).toHaveLength(1);
    expect(sheetPrompts[0]).toContain('角色设定图');
    expect(sheetPrompts[0]).toContain('正面特写');
    expect(sheetPrompts[0]).toContain('侧面全身');
    expect(sheetPrompts[0]).toContain('顶部俯视');
    expect(sheetPrompts[0]).toContain('背面全身');
    expect(sheetPrompts[0]).toContain('同一只宠物');
    expect(sheetPrompts[0]).toContain('纯白色干净背景');
  });

  it('身份锁定条件化：文字流头像不写"以参考照片为准"（金科玉律 #4），照片流两类提示词都带', async () => {
    // 文字流：无参考图不写一致性话术，且根本没有设定图调用
    await generatePetImageOptions({ petId: 'p1', species: 'cat', breed: '英短', gender: '', styleKey: 'q' });
    expect(splitCalls().headPrompts[0]).not.toContain('以参考照片为准');
    mockCallSeedream.mockClear();
    // 照片流：头像与设定图都带
    await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
      photoUrl: 'https://e.com/photo.jpg',
    });
    const { headPrompts, sheetPrompts } = splitCalls();
    expect(headPrompts[0]).toContain('以参考照片为准');
    expect(sheetPrompts[0]).toContain('以参考照片为准');
  });

  it('有参考图时设定图画风关键词不含"头像"字样（防与四视图指令打架）', async () => {
    await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'watercolor',
      photoUrl: 'https://e.com/photo.jpg',
    });
    const { sheetPrompts } = splitCalls();
    // 版式指令里"正面特写头像"是唯一合法出现处，画风关键词的"头像"已被替换为"形象"
    const hits = sheetPrompts[0].match(/头像/g) ?? [];
    expect(hits).toHaveLength(1);
  });

  it('照片批量流程生成 2 套（4 次调用），配额仍记 1 次/运行（立项 P0-1 降本：3套→2套）', async () => {
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'dog',
      breed: '金毛',
      gender: 'male',
      photoUrl: 'https://e.com/dog.jpg',
    });
    expect(options).toHaveLength(2);
    // 每套=头像+设定图 → 2 套共 4 次调用；参考图 URL 透传给每次调用
    expect(mockCallSeedream.mock.calls.length).toBe(4);
    for (const call of mockCallSeedream.mock.calls) {
      expect(call[1]).toBe('https://e.com/dog.jpg');
    }
  });

  it('设定图失败时降级 sheetUrl=null，头像仍返回（尽力项不拖垮整套）', async () => {
    mockCallSeedream.mockImplementation(async (prompt: string) =>
      prompt.includes('角色设定图') ? null : 'https://cdn.example.com/head.png',
    );
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'q',
    });
    expect(options).not.toBeNull();
    expect(options![0].url).toBe('https://cdn.example.com/head.png');
    expect(options![0].sheetUrl).toBeNull();
  });

  it('全部候选失败返回 null（不返回丑陋占位图）', async () => {
    mockCallSeedream.mockResolvedValue(null);
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
    });
    expect(options).toBeNull();
  });

  it('传表情时表情提示词同时进头像与设定图（照片流程）', async () => {
    await generatePetImageOptions({
      petId: 'p1',
      species: 'dog',
      breed: '金毛',
      gender: 'male',
      styleKey: 'clay',
      expression: 'happy',
      photoUrl: 'https://e.com/dog.jpg',
    });
    const { headPrompts, sheetPrompts } = splitCalls();
    expect(headPrompts).toHaveLength(1);
    expect(sheetPrompts).toHaveLength(1);
    expect(headPrompts[0]).toContain('开心的表情');
    expect(sheetPrompts[0]).toContain('开心的表情');
    expect(headPrompts[0]).toContain('一只公金毛狗狗');
  });

  it('未知画风 key 过滤后为空 → 返回 null（白名单由路由层把关）', async () => {
    const options = await generatePetImageOptions({
      petId: 'p1',
      species: 'cat',
      breed: '英短',
      gender: '',
      styleKey: 'not-exist',
    });
    expect(options).toBeNull();
    expect(mockCallSeedream).not.toHaveBeenCalled();
  });
});

describe('extractPetAppearance 照片自动提取外貌', () => {
  beforeEach(() => {
    mockAnalyzeImage.mockReset();
  });

  it('正常提取并清洗（去换行/截断 100 字）', async () => {
    mockAnalyzeImage.mockResolvedValue(`橘色虎斑英短\n橙底深棕条纹，额头M纹，圆脸，琥珀色大眼睛，粉色鼻头，白下巴胸毛，四肢粗短胖乎乎的，毛色层次分明`);
    const result = await extractPetAppearance('https://e.com/photo.jpg');
    expect(result).toContain('橘色虎斑英短 橙底深棕条纹');
    expect(result).not.toContain('\n');
    expect(mockAnalyzeImage).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: 'https://e.com/photo.jpg' }),
    );
  });

  it('视觉返回 null（未配置 key）时返回 null（调用方降级）', async () => {
    mockAnalyzeImage.mockResolvedValue(null);
    expect(await extractPetAppearance('https://e.com/photo.jpg')).toBeNull();
  });

  it('视觉抛错时向上抛（由路由层兜底降级，不影响生成）', async () => {
    mockAnalyzeImage.mockRejectedValue(new Error('network'));
    await expect(extractPetAppearance('https://e.com/photo.jpg')).rejects.toThrow('network');
  });
});
