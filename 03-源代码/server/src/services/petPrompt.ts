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
 * 单只宠物主体描述：一只英短猫咪 / 一只母英短猫咪 / 一只毛茸茸的猫咪
 * @param breed - 品种，可为空（档案未填）
 * @param species - 物种（dog / cat / 其他）
 * @param genderLabel - 可选性别前缀（公 / 母 / 空）
 * @returns 主体描述，绝不包含宠物名字
 */
export function petSubjectText(breed: string | null | undefined, species: string, genderLabel = ''): string {
  // 品种是用户自由文本：先清洗换行/控制字符再截断，防止污染提示词结构或注入额外指令
  const b = (breed || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 20);
  return b
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
