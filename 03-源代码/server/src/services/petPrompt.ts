/**
 * 宠物生图提示词公共模块
 *
 * 把项目提示词库《宠物回忆录-提示词库.md》中适用于「AI 生图」的规范固化成可复用函数，
 * 所有调用 Seedream 等文生图/图生图的服务（全家福 / 头像 / 2D 表情包）统一引用，
 * 防止各自写一套提示词导致质量参差、再次翻车。依据的提示词库章节：
 * - §0.6 全局角色锁定表：数量敏感角色显式声明、易跑偏角色显式排除（禁止模型加戏）
 * - §四 角色一致性模板：face/fur/body keep（毛色/花纹/体型/五官锁定）
 * - 宠物主体描述规范：品种具体化，品种缺失时兜底
 *
 * ⚠️ 关键安全规则：提示词中绝不写宠物名字！
 * 名字对文生图模型是噪声甚至灾难——猫咪叫「烧鸡」会被画成一只烧鸡，
 * 且会覆盖参考图把主体画错。名字只用于入库记录，不进 prompt。
 */

/** 物种中文名（dog → 狗狗，其余一律视为猫咪） */
export function petSpeciesLabel(species: string): string {
  return species === 'dog' ? '狗狗' : '猫咪';
}

/** 品种缺失时的兜底描述（避免提示词出现空串或 undefined） */
export const PET_BREED_FALLBACK = '毛茸茸的';

/**
 * 「不确定品种」标记词：前端 unknown_mix 的展示文案（及同类口语词）。
 * 这些词对文生图模型是无效噪声甚至指令污染（「不确定」可能被当成指令执行，
 * 与 2026-08-24「烧鸡」被画成鸡同类风险的低危版），命中时按品种缺失兜底。
 */
const UNKNOWN_BREED_MARKERS = ['不确定品种', '混血', '串串'];

/**
 * 单只宠物主体描述：一只英短猫咪 / 一只母英短猫咪 / 一只毛茸茸的猫咪
 * @param breed - 品种，可为空（档案未填）
 * @param species - 物种（dog / cat / 其他）
 * @param genderLabel - 可选性别前缀（公 / 母 / 空）
 * @returns 主体描述，绝不包含宠物名字
 */
export function petSubjectText(breed: string | null | undefined, species: string, genderLabel = ''): string {
  // 品种是用户自由文本：先清洗换行/控制字符再截断，防止污染提示词结构或注入额外指令
  const b = (breed || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 20);
  // 「不确定品种」等标记命中时按品种缺失兜底，避免「一只不确定品种的猫咪」进入提示词
  const isUnknownBreed = UNKNOWN_BREED_MARKERS.some((m) => b.includes(m));
  return b && !isUnknownBreed
    ? `一只${genderLabel}${b}${petSpeciesLabel(species)}`
    : `一只${genderLabel}${PET_BREED_FALLBACK}${petSpeciesLabel(species)}`;
}

/**
 * 角色一致性约束（仅图生图/有参考照片时使用）
 * 对应提示词库 §四「角色一致性模板」：face keep / fur keep / body keep
 * 多图/参考图合成时，外观以参考照片为准，禁止模型自由发挥
 */
export const PET_IDENTITY_KEEP =
  '以参考照片为准，保持宠物的毛色、花纹、体型、五官与参考图完全一致，不改变外貌';

/**
 * 主体锁定（单只场景）：防模型加戏/多画/混入其他主体
 * 对应提示词库 §0.6「数量敏感角色显式声明」
 */
export const PET_ONLY_ONE =
  '画面中只出现这一只宠物，不要出现其他动物、人物或食物';

/** 中文序数（左起第一只 / 第二只…；超过十只用阿拉伯数字兜底，实际全家福成员远达不到） */
const CN_ORDINALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/**
 * 名字 → 外貌指代 转译器：允许用户用自己的话提到宠物名字，但名字绝不进提示词
 *
 * 用户心智模型是「烧鸡在左边追蝴蝶」，而生图模型听到「烧鸡」就会画一只烧鸡
 * （2026-08-24 真实事故）。本函数在服务端清洗阶段把已知宠物名替换为
 * 「那只英短猫咪」（单只）/「左起第二只橘猫」（多只，配合全家福排位顺序）
 * 式的外貌指代——用户零学习成本，模型收到的是纯外貌语言。
 *
 * @param raw - 用户自由文本（应已过基础清洗）
 * @param pets - 已知宠物集合（名字是有限集合，来自档案）；多只时数组顺序=画面从左到右顺序
 * @returns 转译后的文本；无命中原样返回
 */
export function translatePetNames(
  raw: string,
  pets: Array<{ name?: string | null; breed?: string | null; species?: string | null }>,
): string {
  if (!raw) return raw;
  // 收集有效名字（去空白、限长、按名字去重），并记录序号用于多宠方位前缀
  const nameMap = new Map<string, { breed: string | null; species: string; ordinal: number }>();
  let ordinal = 0;
  for (const p of pets) {
    const name = (p.name || '').trim();
    if (!name || name.length > 20 || nameMap.has(name)) continue;
    ordinal += 1;
    nameMap.set(name, { breed: p.breed ?? null, species: p.species ?? '', ordinal });
  }
  if (nameMap.size === 0) return raw;

  const multi = nameMap.size > 1;
  // 长名字优先替换，避免短名是长名子串时误伤（如「小猫」⊂「小猫咪」）
  const names = [...nameMap.keys()].sort((a, b) => b.length - a.length);
  let out = raw;
  for (const name of names) {
    const info = nameMap.get(name)!;
    // 外貌指代复用主体描述模块（含品种兜底与「不确定品种」防污染），去掉「一只」前缀拼方位词
    const subject = petSubjectText(info.breed, info.species).replace(/^一只/, '');
    const prefix = multi ? `左起第${CN_ORDINALS[info.ordinal - 1] ?? info.ordinal}只` : '那只';
    out = out.split(name).join(`${prefix}${subject}`);
  }
  return out;
}
