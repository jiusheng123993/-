/**
 * 喂养建议 AI 深度分析服务（会员专属）
 *
 * 流程（参照 symptomAiService 的成熟模式）：
 *   前端规则引擎的 FeedingProfile（品种/慢病/过敏/年龄/体重等）
 *   → 服务端注入宠物档案 + 喂养记录 + 记忆闸门召回（饮食相关）
 *   → aiService.chat 组织话术 → guardCheckOutput 输出安全检测（拦截诊断/用药越界）
 *   → 返回 AI 生成的个性化喂食建议
 *
 * 红线（与症状 AI 一致）：不做诊断、不推荐具体药物剂量、强制免责声明；
 * 记忆/喂养记录只作背景，不改写前端规则引擎的硬结论。
 */
import { pool } from '../db.js';
import { PetRepository } from '../repositories/petRepository.js';
import { FeedingRecordRepository } from '../repositories/feedingRecordRepository.js';
import { chat, guardCheckOutput } from './aiService.js';

const petRepository = new PetRepository();
const feedingRecordRepository = new FeedingRecordRepository();

/** 喂养建议 AI 请求体（由前端规则引擎的 FeedingProfile 转化而来） */
export interface AiFeedingAdviceInput {
  petName: string;
  species: 'dog' | 'cat';
  breed: string;
  ageMonths: number;
  weight: number;
  bodyCondition: 'underweight' | 'normal' | 'overweight';
  isPuppyKitten: boolean;
  isSenior: boolean;
  isNeutered: boolean;
  chronicConditions: string[]; // 慢病名（如 ['慢性肾病']）
  allergies: string[];
  recentAppetite?: 'good' | 'normal' | 'poor';
  recentStool?: 'normal' | 'loose' | 'hard';
  currentAdvice: string; // 前端规则引擎已生成的建议（供 AI 参考增强，不重写）
}

/** AI 喂养建议结果 */
export interface AiFeedingAdviceResult {
  aiAdvice: string;               // AI 组织的个性化喂食建议（含免责声明）
  memoriesUsed: Array<{ content: string; importance: number; category: string }>;
  unsafe: boolean;                // 输出安全检测是否拦截
  degraded?: boolean;             // LLM 调用失败降级
}

/** 免责声明（沿用 PRD 8.4 宠物管家免责模板） */
const DISCLAIMER = '⚠️ 以上为 AI 辅助分析，仅供参考，不替代专业兽医诊断或营养师意见。宠物出现异常请及时就医。';

/** 计算宠物年龄（月） */
function calcAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate + 'T00:00:00.000Z');
  const now = new Date();
  return Math.max(
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (now.getUTCMonth() - birth.getUTCMonth()),
    0,
  );
}

/** 日期格式化（pg TIMESTAMPTZ → YYYY-MM-DD） */
function formatDate(d: unknown): string {
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

/**
 * 构建系统提示词：注入红线、宠物画像、喂养记录、记忆、规则建议
 * 红线指令是硬约束（不做诊断/不推荐用药），由 guardCheckOutput 做第二道兜底
 */
function buildPrompt(
  petProfileText: string,
  input: AiFeedingAdviceInput,
  feedingRecordsText: string,
  memoryTextBlock: string,
): string {
  const stage = input.isPuppyKitten ? '幼年期' : input.isSenior ? '老年期' : '成年期';
  return [
    '你是星河宠记的宠物营养顾问。请根据给定信息，为该宠物生成个性化、可执行的喂食建议（3-6 条，简洁口语化，每条约一句话）。',
    '',
    '## 铁律（必须严格遵守）',
    '1. 不输出"得了XX病"式诊断结论；涉及疾病只能说"与XX相关/建议咨询兽医"',
    '2. 不推荐具体药物、剂量、处方粮品牌的具体配方（可提"可咨询兽医选择处方粮"）',
    '3. 必须结合体重变化、食欲、排便等真实数据给出针对性建议',
    '4. 结尾附免责声明',
    '',
    '## 宠物画像',
    petProfileText,
    `## 当前阶段：${stage}`,
    `## 饮食注意事项（规则引擎产出，供参考）\n${input.currentAdvice || '（无）'}`,
    feedingRecordsText ? `## 近期喂养记录\n${feedingRecordsText}` : '',
    memoryTextBlock ? `## 历史记忆（饮食/健康相关，仅供参考背景）\n${memoryTextBlock}` : '',
    '',
    '## 输出要求',
    '直接输出建议列表（每条用"1. "编号），不要输出 JSON 或多余解释。',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 喂养建议 AI 主流程
 * @param userId - 用户 ID
 * @param petId - 宠物 ID
 * @param input - 前端规则引擎产出的喂养画像
 */
export async function analyzeFeedingAdvice(
  userId: string,
  petId: string,
  input: AiFeedingAdviceInput,
): Promise<AiFeedingAdviceResult> {
  // 1. 宠物档案（用于 prompt 个性化；数据库为权威，覆盖前端传入的空字段）
  const pet = await petRepository.findByIdAndUser(petId, userId);

  // 2. 近 30 天喂养记录（真实数据）
  const feedingRows = await feedingRecordRepository.findByPet(petId, userId);

  // 3. 记忆闸门召回（饮食/健康相关，近 90 天 active 记忆）
  //    复用 memoryService 的召回能力，但这里主要靠上面的喂养记录，记忆作补充背景
  const { recallHealthMemories } = await import('./memoryService.js');
  const memories = await recallHealthMemories(userId, petId, ['喂养', '食物', '过敏', '进食', '食欲'], 5);
  const memoriesUsed = memories.map((m) => ({
    content: m.content,
    importance: m.importance,
    category: m.category,
  }));

  // 4. 组装上下文文本（用户可控内容一律截断，防止注入面过大）
  const petName = pet?.name?.slice(0, 30) || input.petName.slice(0, 30) || '我的宠物';
  const petProfileText = pet
    ? [
        `- 名字：${pet.name.slice(0, 30)}`,
        `- 物种/品种：${pet.species === 'dog' ? '犬' : '猫'}${pet.breed ? `（${pet.breed.slice(0, 30)}）` : ''}`,
        pet.birth_date ? `- 年龄：${calcAgeMonths(pet.birth_date)} 个月` : input.ageMonths ? `- 年龄（前端画像）：${input.ageMonths} 个月` : '',
        pet.weight ? `- 体重：${pet.weight}kg` : input.weight ? `- 体重（前端画像）：${input.weight}kg` : '',
        pet.is_neutered ? '- 已绝育' : input.isNeutered ? '- 已绝育（前端画像）' : '',
        pet.notes ? `- 档案备注：${pet.notes.slice(0, 100)}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : [
        `- 名字：${petName}`,
        `- 物种/品种：${input.species === 'dog' ? '犬' : '猫'}${input.breed ? `（${input.breed.slice(0, 30)}）` : ''}`,
        input.ageMonths ? `- 年龄：${input.ageMonths} 个月` : '',
        input.weight ? `- 体重：${input.weight}kg` : '',
        input.isNeutered ? '- 已绝育' : '',
      ]
        .filter(Boolean)
        .join('\n');

  const feedingRecordsText =
    feedingRows.length > 0
      ? feedingRows
          .slice(0, 20) // 最多取最近 20 条，避免 prompt 过长
          .map(
            (r) =>
              `- ${formatDate(r.record_date)}：${r.food_type}${r.amount ? ` ${r.amount}${r.unit || 'g'}` : ''}${r.meal_time ? `（${r.meal_time}）` : ''}${r.appetite === 'poor' ? '，食欲差' : r.appetite === 'good' ? '，食欲好' : ''}${r.stool === 'loose' ? '，软便' : r.stool === 'hard' ? '，便秘' : ''}`,
          )
          .join('\n')
      : '';

  // 5. 调 LLM（关闭思考模式，避免 max_tokens 被 reasoning 吃掉；失败降级返回，不抛 500）
  let raw = '';
  try {
    raw = (
      (await chat(
        [
          {
            role: 'system',
            content: buildPrompt(petProfileText, input, feedingRecordsText, memoryText(memoriesUsed)),
          },
          { role: 'user', content: `请为${petName}生成今日喂食建议。` },
        ],
        { temperature: 0.6, max_tokens: 800, thinking: 'disabled' },
      )) ?? ''
    ).trim();
  } catch {
    return {
      aiAdvice: `AI 喂养建议暂时不可用，请稍后再试。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: false,
      degraded: true,
    };
  }

  // 6. 输出安全检测（fail-closed；care 场景：允许"就医提醒/遵医嘱"，只拦真危险内容）
  const guard = await guardCheckOutput(raw, { failClosed: true, scope: 'care' });
  if (guard.isUnsafeMedicalAdvice) {
    return {
      aiAdvice: `本次 AI 喂养建议因安全校验未通过已被拦截。${DISCLAIMER}`,
      memoriesUsed,
      unsafe: true,
    };
  }

  return {
    aiAdvice: `${raw}\n\n${DISCLAIMER}`,
    memoriesUsed,
    unsafe: false,
  };
}

/** 记忆文本组装（供 prompt 的"历史记忆"段） */
function memoryText(memories: Array<{ content: string; importance: number; category: string }>): string {
  if (memories.length === 0) return '';
  return memories
    .map((m) => `- [${m.category === 'medical' ? '医疗' : '健康'}] ${m.content}（重要度：${m.importance}）`)
    .join('\n');
}
