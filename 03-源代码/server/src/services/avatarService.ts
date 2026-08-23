/**
 * 宠物形象生成服务 - 调用 Seedream API 生成宠物形象
 * 支持卡通/写实单张生成（旧接口），以及多风格候选批量生成（新接口）
 */
import { config } from '../config.js';
import { callSeedream } from './image2DService.js';
// 宠物提示词公共模块：统一按提示词库 §0.6/§四 规范构造（角色锁定 + 主体锁定 + 品种兜底）
import { petSubjectText, PET_IDENTITY_KEEP, PET_ONLY_ONE } from './petPrompt.js';

/** 宠物形象生成请求参数 */
export interface GeneratePetImageParams {
  petId: string;
  species: string;
  breed: string;
  gender: string;
  photoUrl?: string;
  style?: string;
}

/** 宠物形象生成结果 */
export interface GeneratePetImageResult {
  url: string;
  isPlaceholder: boolean;
}

const DEFAULT_STYLE = 'cartoon';

/**
 * 多风格候选定义（5 种画风 × 猫/狗各一套描述）
 * - 多宠家庭里猫狗可能同时存在，所以每种画风都要有猫、狗专属提示词，
 *   避免把猫咪生成成狗狗脸、或狗狗生成成猫咪脸
 * - 提示词必须把各画风写得很"极端"且互相排斥，否则带参考照片图生图时
 *   所有图都会往参考照片写实方向收敛，看起来几乎一样
 */
export const AVATAR_STYLE_OPTIONS = [
  {
    key: 'q',
    label: 'Q版萌系',
    dog: '典型Q版二头身狗狗，超大头小身体，圆脸占画面一半，大圆眼带高光，腮红，耳朵软萌下垂，线条圆润无棱角，萌系贴纸质感',
    cat: '典型Q版二头身猫咪，超大头小身体，圆脸占画面一半，大圆眼带高光，腮红，猫耳小巧，胡须简洁，线条圆润无棱角，萌系贴纸质感',
  },
  {
    key: 'japanese',
    label: '日系治愈',
    dog: '日系治愈系狗狗插画，水彩晕染，奶油色柔和渐变，吉卜力式温馨氛围，毛发细腻柔和笔触',
    cat: '日系治愈系猫咪插画，水彩晕染，奶油色柔和渐变，吉卜力式温馨氛围，皮毛细腻柔和笔触',
  },
  {
    key: 'american',
    label: '美式卡通',
    dog: '美式动画电影风格狗狗角色（类似皮克斯/迪士尼），粗描边，高饱和撞色，夸张五官和生动表情',
    cat: '美式动画电影风格猫咪角色（类似皮克斯/迪士尼），粗描边，高饱和撞色，夸张五官和生动表情',
  },
  {
    key: 'watercolor',
    label: '水彩手绘',
    dog: '清新水彩手绘狗狗头像，透明水彩晕染，留白边缘，纸张纹理，淡雅清新',
    cat: '清新水彩手绘猫咪头像，透明水彩晕染，留白边缘，纸张纹理，淡雅清新',
  },
  {
    key: 'clay',
    label: '黏土萌宠',
    dog: '黏土玩偶质感狗狗，软陶立体，手作质感，圆润可爱，柔和影棚光',
    cat: '黏土玩偶质感猫咪，软陶立体，手作质感，圆润可爱，柔和影棚光',
  },
] as const;

/** 多风格候选生成请求参数 */
export interface GeneratePetImageOptionsParams {
  petId: string;
  species: string;
  breed: string;
  gender: string;
  /** 参考照片 URL（有则图生图保证像宠物本人，无则文生图） */
  photoUrl?: string;
  /** 基础基调：cartoon（卡通）/ realistic（写实） */
  style?: string;
  /**
   * 用户文字描述（可选，如"橘色英短、圆脸胖乎乎的"）
   * 描述会拼进提示词参与生图；空则只用宠物档案自动描述。
   * ⚠️ 清洗：截断 100 字 + 去换行；提醒用户不要写宠物名字（防「烧鸡」被画成鸡）
   */
  description?: string;
}

/** 单个风格候选结果 */
export interface PetImageOption {
  style: string;
  label: string;
  url: string;
}

/**
 * 生成多风格候选形象（5 种画风，猫狗各一套提示词）
 * 并发调用 Seedream 生成全部候选；任一失败自动跳过，全部失败返回 null
 * @returns 候选列表；AI 服务不可用时返回 null（不返回丑陋占位图）
 */
export async function generatePetImageOptions(
  params: GeneratePetImageOptionsParams,
): Promise<PetImageOption[] | null> {
  const apiKey = config.seedream.apiKey;
  if (!apiKey) return null;

  const style = params.style || DEFAULT_STYLE;
  const genderLabel = params.gender === 'male' ? '公' : params.gender === 'female' ? '母' : '';
  const isDog = params.species === 'dog';
  const styleText = style === 'realistic' ? '写实风格，真实细腻' : '可爱卡通风格';
  // 主体用公共模块（品种兜底 + 绝不写名字）；图生图时追加角色锁定与主体锁定
  const subject = petSubjectText(params.breed, params.species, genderLabel);

  // 用户文字描述：清洗换行/控制字符 + 截断 100 字，拼进提示词（空则只用档案自动描述）
  const userDesc = (params.description || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 100);
  const basePrompt = userDesc
    ? `${subject}的头像，${userDesc}，高质量，细节丰富，干净背景`
    : `${subject}的头像，高质量，细节丰富，干净背景`;

  // 5 种风格并发生成，互不阻塞；某个风格失败不影响其余候选
  const results = await Promise.allSettled(
    AVATAR_STYLE_OPTIONS.map((item) =>
      callSeedream(`${basePrompt}，${styleText}，${isDog ? item.dog : item.cat}，${PET_IDENTITY_KEEP}，${PET_ONLY_ONE}`, params.photoUrl || '', apiKey).then((url) =>
        url ? { style: item.key, label: item.label, url } : null,
      ),
    ),
  );

  const options: PetImageOption[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      options.push(result.value);
    } else if (result.status === 'rejected') {
      console.warn('[AvatarOptions] 某个风格生成失败:', result.reason);
    }
  }

  // 至少成功 1 张才算可用；全部失败视为服务不可用
  return options.length > 0 ? options : null;
}

function generateSvgPlaceholder(params: GeneratePetImageParams): string {
  const colorMap: Record<string, string> = {
    dog: '#F5A623',
    cat: '#7ED321',
  };
  const speciesEmoji: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
  };
  const color = colorMap[params.species] || '#8B5CF6';
  const emoji = speciesEmoji[params.species] || '🐾';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}" rx="20"/>
  <text x="200" y="180" text-anchor="middle" font-size="100">${emoji}</text>
  <text x="200" y="260" text-anchor="middle" font-size="24" fill="white" font-family="sans-serif">${params.breed}</text>
  <text x="200" y="300" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.7)" font-family="sans-serif">AI 形象生成暂不可用</text>
  <text x="200" y="330" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)" font-family="sans-serif">请配置 SEEDREAM_API_KEY</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generatePetImage(
  params: GeneratePetImageParams,
): Promise<GeneratePetImageResult> {
  const apiKey = config.seedream.apiKey;

  if (!apiKey) {
    return {
      url: generateSvgPlaceholder(params),
      isPlaceholder: true,
    };
  }

  const style = params.style || DEFAULT_STYLE;
  const genderLabel = params.gender === 'male' ? '公' : params.gender === 'female' ? '母' : '';

  // 纯文生图（无参考照片）：主体用公共模块，不追加"以参考照片为准"（无图可参考），
  // 但保留主体锁定，防模型加戏/多画
  const prompt = `${petSubjectText(params.breed, params.species, genderLabel)}的${style}风格头像，高质量，细节丰富，可爱温馨，${PET_ONLY_ONE}`;

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-0-250828',
        prompt,
        size: '1024x1024',
        n: 1,
      }),
    });

    if (!response.ok) {
      console.error('[Seedream] API error:', response.status);
      return {
        url: generateSvgPlaceholder(params),
        isPlaceholder: true,
      };
    }

    const data = (await response.json()) as {
      data: Array<{ url: string }>;
    };

    if (data.data && data.data.length > 0 && data.data[0].url) {
      return {
        url: data.data[0].url,
        isPlaceholder: false,
      };
    }

    return {
      url: generateSvgPlaceholder(params),
      isPlaceholder: true,
    };
  } catch (error) {
    console.error('[Seedream] Error:', error);
    return {
      url: generateSvgPlaceholder(params),
      isPlaceholder: true,
    };
  }
}
