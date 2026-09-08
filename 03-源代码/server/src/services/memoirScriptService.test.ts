/**
 * 回忆录分镜脚本生成器单元测试（M1）
 * 覆盖：
 *   1. 正常生成（LLM 返回合法 JSON）
 *   2. markdown 代码块/前后杂音提取
 *   3. 非法输出重试（第二次成功）
 *   4. 全部失败回退兜底模板
 *   5. 规范化：segments 数量对齐、时长修正、总时长缩放
 *   6. 参数预校验
 *   7. 系统提示词关键规则存在性
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chat } from './aiService.js';
import {
  generateMemoirScript,
  extractJson,
  normalizeScript,
  buildSystemPrompt,
  buildUserContext,
  fallbackTemplate,
  sanitizeMemoirScriptPrompts,
  type MemoirScriptInput,
} from './memoirScriptService.js';
import { MemoirScriptSchema } from '../schemas/memoirScript.js';

// mock AI 对话服务（避免真实网络调用）
vi.mock('./aiService.js', () => ({
  chat: vi.fn(),
}));

const mockedChat = vi.mocked(chat);

/** 合法的分镜脚本 JSON（8 镜纪念 Vlog） */
function validScriptJson(segmentCount = 8): string {
  const segments = Array.from({ length: segmentCount }, (_, i) => ({
    photo_index: i,
    shot_type: 'push_in',
    camera: i % 2 === 0 ? 'wide' : 'close_up',
    lighting: 'golden_hour',
    transition: i === 0 ? 'revealing' : 'cut',
    duration_sec: 5,
    seedance_prompt:
      'GLOBAL STYLE：写实风格，柔和暖调。SCENE：橘猫在窗台。CHARACTERS：角色=参考图1（橘色短毛猫）。LOCATION：窗台。FIRST FRAME：居中。Shot 1（特写，缓慢推镜）：耳朵微动。OPTICS：47度。PHYSICS：毛发柔软。LIGHTING：黄昏暖光。AUDIO：安静无音乐。',
    narration: `十年前的那个下午，你第一次跳上窗台。第${i}段旁白文字。`,
    subtitle: `2016 年夏天 · 初遇`,
  }));
  return JSON.stringify({
    title: '豆豆的一生：窗台边的十年',
    theme: '陪伴与告别',
    emotion_curve: ['calm', 'memory', 'pain', 'relief', 'lingering'],
    narration_voice: '晓晓',
    music_mood: 'nostalgic',
    identity_anchor: '橘色短毛猫，白色胸脯，右耳缺一小角，绿眼睛',
    segments,
  });
}

/** 标准输入（纪念 Vlog，8 张照片） */
function makeInput(overrides: Partial<MemoirScriptInput> = {}): MemoirScriptInput {
  return {
    petProfile: {
      name: '豆豆',
      species: 'cat',
      breed: '橘猫',
      gender: 'male',
    },
    photoCount: 8,
    productLine: 'memorial',
    targetDuration: 75,
    sourceText: '它总在黄昏蹲在窗台。',
    ...overrides,
  };
}

describe('memoirScriptService 分镜生成器', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractJson 提取', () => {
    it('纯 JSON 直接返回', () => {
      const json = '{"a":1}';
      expect(extractJson(json)).toBe(json);
    });

    it('markdown 代码块包裹时提取内部 JSON', () => {
      const json = '{"a":1}';
      expect(extractJson('```json\n' + json + '\n```')).toBe(json);
      expect(extractJson('```\n' + json + '\n```')).toBe(json);
    });

    it('前后有杂音文字时截取首个 { 到最后一个 }', () => {
      const raw = '好的，这是脚本：\n{"segments":[{"photo_index":0}]}\n希望对你有帮助';
      expect(extractJson(raw)).toBe('{"segments":[{"photo_index":0}]}');
    });

    it('无 JSON 时返回原文本', () => {
      const raw = '抱歉，我无法生成';
      expect(extractJson(raw)).toBe(raw);
    });
  });

  describe('generateMemoirScript 主流程', () => {
    it('正常生成：LLM 返回合法 JSON → 返回通过 zod 校验的脚本', async () => {
      mockedChat.mockResolvedValue(validScriptJson());
      const script = await generateMemoirScript(makeInput());
      // zod 再校验一次确保契约完整
      const parsed = MemoirScriptSchema.parse(script);
      expect(parsed.segments).toHaveLength(8);
      expect(parsed.identity_anchor).toContain('橘色短毛猫');
      expect(mockedChat).toHaveBeenCalledTimes(1);
    });

    it('LLM 返回 markdown 包裹的 JSON 也能解析', async () => {
      mockedChat.mockResolvedValue('```json\n' + validScriptJson() + '\n```');
      const script = await generateMemoirScript(makeInput());
      expect(script.segments).toHaveLength(8);
    });

    it('第一次非法输出、第二次合法 → 重试成功后返回', async () => {
      mockedChat
        .mockResolvedValueOnce('这不是 JSON')
        .mockResolvedValueOnce(validScriptJson());
      const script = await generateMemoirScript(makeInput());
      expect(script.segments).toHaveLength(8);
      expect(mockedChat).toHaveBeenCalledTimes(2);
    });

    it('全部失败 → 使用兜底模板（不抛异常，保证可用）', async () => {
      mockedChat.mockResolvedValue('完全无效的输出');
      const script = await generateMemoirScript(makeInput());
      // 兜底模板仍能通过 zod（保证管线不断）
      const parsed = MemoirScriptSchema.parse(script);
      expect(parsed.segments).toHaveLength(8);
      expect(mockedChat).toHaveBeenCalledTimes(3);
    });

    it('照片数量超出产品线范围 → 抛错', async () => {
      await expect(
        generateMemoirScript(makeInput({ photoCount: 20 })),
      ).rejects.toThrow('照片数量');
      expect(mockedChat).not.toHaveBeenCalled();
    });
  });

  describe('normalizeScript 规范化', () => {
    it('segments 多于照片数 → 截断对齐', async () => {
      mockedChat.mockResolvedValue(validScriptJson(10)); // LLM 多给了 2 镜
      const script = await generateMemoirScript(makeInput({ photoCount: 8 }));
      expect(script.segments).toHaveLength(8);
    });

    it('每镜时长修正到 3-8 秒', async () => {
      // 构造超范围时长的 JSON
      const json = JSON.parse(validScriptJson(8));
      json.segments[0].duration_sec = 20;
      json.segments[1].duration_sec = 1;
      mockedChat.mockResolvedValue(JSON.stringify(json));
      const script = await generateMemoirScript(makeInput());
      expect(script.segments[0].duration_sec).toBeLessThanOrEqual(8);
      expect(script.segments[1].duration_sec).toBeGreaterThanOrEqual(3);
    });

    it('总时长贴近目标（75 秒 ÷ 8 镜 ≈ 9 → clamp 到 8）', async () => {
      mockedChat.mockResolvedValue(validScriptJson(8));
      const script = await generateMemoirScript(makeInput({ targetDuration: 75 }));
      const total = script.segments.reduce((s, seg) => s + seg.duration_sec, 0);
      // 8 镜 × 8 秒 = 64，全部 clamp 到 8 时的最大总时长
      expect(total).toBeLessThanOrEqual(64);
      expect(script.segments.every((seg) => seg.duration_sec <= 8)).toBe(true);
    });

    it('segments 按 photo_index 排序', async () => {
      // 乱序的 JSON
      const json = JSON.parse(validScriptJson(8));
      json.segments.reverse();
      mockedChat.mockResolvedValue(JSON.stringify(json));
      const script = await generateMemoirScript(makeInput());
      const indexes = script.segments.map((seg) => seg.photo_index);
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    });
  });

  describe('fallbackTemplate 兜底模板', () => {
    it('纪念 Vlog 生成 8 镜且通过 zod', () => {
      const script = fallbackTemplate(makeInput());
      const parsed = MemoirScriptSchema.parse(script);
      expect(parsed.segments).toHaveLength(8);
      expect(parsed.music_mood).toBe('nostalgic');
    });

    it('宠物名字绝不进入身份锚点与 Seedance 提示词', () => {
      const script = fallbackTemplate(
        makeInput({ petProfile: { name: '烧鸡', species: 'cat', breed: '英短' } }),
      );
      expect(script.anchors?.map((anchor) => anchor.desc).join('')).not.toContain('烧鸡');
      expect(script.segments.map((segment) => segment.seedance_prompt).join('')).not.toContain('烧鸡');
      expect(script.segments[0].seedance_prompt).toContain('电影质感');
      expect(script.segments[0].seedance_prompt).toContain('避免生成任何文字或字幕');
    });

    it('日常回忆录生成 1-3 镜且音乐为 warm', () => {
      const script = fallbackTemplate(
        makeInput({ productLine: 'daily', photoCount: 2, targetDuration: 15 }),
      );
      const parsed = MemoirScriptSchema.parse(script);
      expect(parsed.segments).toHaveLength(2);
      expect(parsed.music_mood).toBe('warm');
    });
  });

  describe('提示词安全清洗与照片上下文', () => {
    it('清除 LLM 锚点和视频 prompt 中泄漏的宠物名字', () => {
      const parsed = MemoirScriptSchema.parse(JSON.parse(validScriptJson()));
      const unsafe = {
        ...parsed,
        anchors: [{ id: 'pet1', type: 'pet' as const, desc: '烧鸡，橘色短毛猫，白色胸脯' }],
        segments: parsed.segments.map((segment) => ({
          ...segment,
          seedance_prompt: `${segment.seedance_prompt.replace('。SCENE：', '。\nSCENE：')} 烧鸡缓慢抬头。`,
        })),
      };
      const safe = sanitizeMemoirScriptPrompts(unsafe, makeInput({
        petProfile: { name: '烧鸡', species: 'cat', breed: '橘猫' },
      }));
      expect(safe.anchors?.[0].desc).not.toContain('烧鸡');
      expect(safe.segments.map((segment) => segment.seedance_prompt).join('')).not.toContain('烧鸡');
      expect(safe.segments[0].seedance_prompt).toContain('\nSCENE：');
      expect(safe.title).toBe(unsafe.title);
      expect(safe.segments[0].narration).toBe(unsafe.segments[0].narration);
    });

    it('把每张照片的视觉摘要按序写入分镜上下文', () => {
      const context = buildUserContext(makeInput({
        photoDescriptions: [
          '照片1：一只橘猫蜷缩在米色沙发上，闭眼休息，室内暖光。',
          '照片2：一只橘猫坐在窗台侧望窗外，尾巴垂下，黄昏逆光。',
        ],
      }));
      expect(context).toContain('【逐张照片视觉摘要】');
      expect(context).toContain('照片1：一只橘猫蜷缩在米色沙发上');
      expect(context).toContain('不得把照片2的动作或场景写入照片1对应分镜');
    });

    it('有记忆摘要时：标注为真实回忆并要求叙事锚定，不出现无记忆约束', () => {
      const context = buildUserContext(makeInput({
        memorySummary: '- [event] 2020-03 到家那天躲在纸箱里不肯出来',
      }));
      expect(context).toContain('真实回忆');
      expect(context).toContain('锚定');
      expect(context).toContain('2020-03 到家那天躲在纸箱里不肯出来');
      expect(context).not.toContain('无记忆约束');
      expect(context).not.toContain('合理构思');
    });

    it('无记忆且无自述时：输出禁止虚构具体事件的无记忆约束', () => {
      const context = buildUserContext(makeInput({
        memorySummary: undefined,
        sourceText: undefined,
      }));
      expect(context).toContain('【无记忆约束】');
      expect(context).toContain('禁止虚构具体事件');
      expect(context).not.toContain('合理构思');
    });

    it('有用户自述时：标注为核心依据且不再邀请模型合理构思', () => {
      const context = buildUserContext(makeInput({
        memorySummary: undefined,
        sourceText: '它最爱玩纸箱，每次拆快递都要先钻进去。',
      }));
      expect(context).toContain('核心依据');
      expect(context).toContain('它最爱玩纸箱');
      // 自述是真实素材：不得再输出"没有任何素材"的无记忆约束（与用户文案段自相矛盾）
      expect(context).not.toContain('无记忆约束');
      expect(context).not.toContain('合理构思');
    });

    it('系统提示词包含记忆锚定规则（防编造）', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('记忆锚定规则');
      expect(prompt).toContain('禁止虚构任何具体事件');
      expect(prompt).toContain('以照片为准');
    });
  });

  describe('buildSystemPrompt 关键规则', () => {
    it('包含 Anti-Subjective 规则与多角色锚点要求', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('Anti-Subjective');
      expect(prompt).toContain('角色锚点');
      expect(prompt).toContain('视觉成因');
    });

    it('包含 Seedance 十段结构与 CREST', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('GLOBAL STYLE');
      expect(prompt).toContain('CREST');
    });
  });
});
