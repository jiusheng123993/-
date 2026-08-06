/**
 * 宠物喂养个性化建议服务
 *
 * 根据宠物档案、慢病记录和品种特征生成喂养建议
 */
import type { PetProfile } from './petService'
import type { ChronicRecord } from '../types/chronicTypes'
import { getChronicRecords } from './chronicService'

export interface PersonalizedFeedingAdvice {
  type: 'daily_amount' | 'meal_frequency' | 'food_type' | 'supplement' | 'warning' | 'allergy' | 'chronic' | 'breed_specific'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}

export interface FeedingProfile {
  pet: PetProfile
  ageMonths: number
  weight: number
  bodyCondition: 'underweight' | 'normal' | 'overweight'
  chronicConditions: ChronicRecord[]
  allergies: string[]
  isPuppyKitten: boolean
  isSenior: boolean
  isNeutered: boolean
}

const BREED_FEEDING_GUIDE: Record<string, { tips: string[]; sensitiveTo: string[] }> = {
  '金毛': {
    tips: ['金毛易肥胖，控制每日热量摄入', '建议分2-3餐喂养，避免一次进食过多', '可添加关节保健品预防髋关节问题'],
    sensitiveTo: ['高脂肪食物', '过量零食'],
  },
  '拉布拉多': {
    tips: ['拉布拉多食欲旺盛，需严格控制分量', '使用慢食碗减慢进食速度', '定期称重监控体重变化'],
    sensitiveTo: ['高热量食物', '人类餐桌食物'],
  },
  '柯基': {
    tips: ['柯基易肥胖，严格控制零食', '注意腰椎健康，控制体重', '建议低脂配方'],
    sensitiveTo: ['高热量食物', '过量碳水化合物'],
  },
  '法斗': {
    tips: ['法斗易过敏，选择低敏配方', '控制体重减轻呼吸道负担', '小颗粒狗粮更易咀嚼'],
    sensitiveTo: ['谷物', '鸡肉（部分个体）', '人工添加剂'],
  },
  '橘猫': {
    tips: ['橘猫易发胖，严格控制每日食量', '增加互动喂食增加活动量', '选择高蛋白低碳水配方'],
    sensitiveTo: ['过量碳水化合物', '高脂肪零食'],
  },
  '布偶': {
    tips: ['布偶猫肠胃敏感，选择易消化配方', '注意毛球管理，定期化毛', '保持水分摄入预防泌尿道问题'],
    sensitiveTo: ['突然换粮', '劣质蛋白质'],
  },
  '英短': {
    tips: ['英短易发胖，控制热量摄入', '注意泌尿道健康，保证饮水', '选择含牛磺酸的优质猫粮'],
    sensitiveTo: ['高镁食物', '过量零食'],
  },
  '美短': {
    tips: ['美短活动量大，保证蛋白质摄入', '注意口腔健康，定期洁齿', '选择含Omega-3的配方'],
    sensitiveTo: ['劣质填充物'],
  },
}

const CHRONIC_FEEDING_ADVICE: Record<string, { tips: string[]; avoid: string[] }> = {
  '慢性肾病': {
    tips: ['选择低磷配方肾脏处方粮', '保证充足新鲜饮水', '控制蛋白质摄入量但保证优质蛋白'],
    avoid: ['高磷食物', '高盐零食', '人类调味食物'],
  },
  '心脏病': {
    tips: ['选择低钠配方心脏处方粮', '控制饮水量遵医嘱', '补充牛磺酸和Omega-3'],
    avoid: ['高盐食物', '高脂肪食物', '过量零食'],
  },
  '糖尿病': {
    tips: ['选择高纤维低GI处方粮', '定时定量喂养，不可随意加餐', '与胰岛素注射时间配合'],
    avoid: ['高糖食物', '高碳水化合物', '含糖零食'],
  },
  '胰腺炎': {
    tips: ['选择超低脂易消化处方粮', '少食多餐，减轻胰腺负担', '避免突然换粮'],
    avoid: ['高脂肪食物', '油炸食物', '肥肉'],
  },
  '关节炎': {
    tips: ['控制体重减轻关节负担', '补充葡萄糖胺和软骨素', '选择含Omega-3的抗炎配方'],
    avoid: ['高热量导致肥胖的食物'],
  },
  '泌尿道结石': {
    tips: ['选择泌尿道处方粮控制pH值', '增加饮水量，考虑湿粮', '定期复查尿液'],
    avoid: ['高镁食物', '高钙零食', '过咸食物'],
  },
  '肝病': {
    tips: ['选择肝脏处方粮，易消化高营养', '少食多餐，减轻肝脏负担', '补充维生素E和S-腺苷蛋氨酸'],
    avoid: ['高铜食物', '高脂肪食物', '加工食品'],
  },
}

export async function buildFeedingProfile(
  pet: PetProfile,
  userId: string,
  allergies?: string[],
  isNeutered?: boolean
): Promise<FeedingProfile> {
  const birthDate = new Date(pet.birthDate)
  const now = new Date()
  const ageMonths = Math.max(0, (now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth())

  const isPuppyKitten = pet.species === 'dog' ? ageMonths < 12 : ageMonths < 12
  const isSenior = pet.species === 'dog' ? ageMonths >= 84 : ageMonths >= 120

  let bodyCondition: 'underweight' | 'normal' | 'overweight' = 'normal'

  const chronicRecords = await getChronicRecords(pet.id, userId)

  return {
    pet,
    ageMonths,
    weight: pet.weight || 0,
    bodyCondition,
    chronicConditions: chronicRecords.filter(r => r.status === 'active'),
    allergies: allergies || [],
    isPuppyKitten,
    isSenior,
    isNeutered: isNeutered ?? false,
  }
}

export function generatePersonalizedAdvice(
  profile: FeedingProfile,
  recentAppetite?: 'good' | 'normal' | 'poor',
  recentStool?: 'normal' | 'loose' | 'hard'
): PersonalizedFeedingAdvice[] {
  const advice: PersonalizedFeedingAdvice[] = []
  const { pet, ageMonths, weight, chronicConditions, allergies, isPuppyKitten, isSenior, isNeutered } = profile

  const dailyCalories = calculateDailyCalories(profile)
  const dailyAmount = calculateDailyAmount(profile, dailyCalories)

  advice.push({
    type: 'daily_amount',
    title: '每日建议喂食量',
    content: `${pet.name}每日建议热量约 ${dailyCalories} kcal，约合干粮 ${dailyAmount}g（分 ${isPuppyKitten ? '3-4' : isSenior ? '2-3' : '2'} 餐）`,
    priority: 'high',
    icon: '⚖️',
  })

  if (isPuppyKitten) {
    advice.push({
      type: 'meal_frequency',
      title: '幼年宠物喂养要点',
      content: `${pet.species === 'dog' ? '幼犬' : '幼猫'}需要更频繁的进食（3-4餐/天），选择${pet.species === 'dog' ? '幼犬' : '幼猫'}专用配方，保证充足蛋白质和钙质。`,
      priority: 'high',
      icon: '🍼',
    })
  }

  if (isSenior) {
    advice.push({
      type: 'meal_frequency',
      title: '老年宠物喂养调整',
      content: '老年宠物代谢减慢，建议选择低热量高纤维配方，可添加关节保健品和抗氧化剂，注意观察牙齿咀嚼能力。',
      priority: 'high',
      icon: '🧓',
    })
  }

  if (isNeutered) {
    advice.push({
      type: 'food_type',
      title: '绝育后饮食注意',
      content: '绝育后代谢降低约20-30%，建议选择绝育专用配方或减少日常喂食量15-20%，定期称重防止肥胖。',
      priority: 'medium',
      icon: '✂️',
    })
  }

  const breedGuide = BREED_FEEDING_GUIDE[pet.breed]
  if (breedGuide) {
    advice.push({
      type: 'breed_specific',
      title: `${pet.breed}品种喂养指南`,
      content: breedGuide.tips.join('；'),
      priority: 'medium',
      icon: '🐾',
    })
  }

  for (const condition of chronicConditions) {
    const chronicAdvice = CHRONIC_FEEDING_ADVICE[condition.condition]
    if (chronicAdvice) {
      advice.push({
        type: 'chronic',
        title: `${condition.condition}饮食管理`,
        content: chronicAdvice.tips.join('；'),
        priority: 'high',
        icon: '🩺',
      })
      if (chronicAdvice.avoid.length > 0) {
        advice.push({
          type: 'warning',
          title: `${condition.condition}需避免的食物`,
          content: `请避免：${chronicAdvice.avoid.join('、')}`,
          priority: 'high',
          icon: '⚠️',
        })
      }
    }
  }

  if (allergies.length > 0) {
    advice.push({
      type: 'allergy',
      title: '过敏提醒',
      content: `${pet.name}对以下物质过敏：${allergies.join('、')}。请仔细检查食物成分表，避免含这些成分的食品。`,
      priority: 'high',
      icon: '🚫',
    })
  }

  if (recentAppetite === 'poor') {
    advice.push({
      type: 'warning',
      title: '近期食欲不佳',
      content: '宠物最近食欲不佳，建议检查食物新鲜度，可尝试加热湿粮增加香气，或更换口味。如持续不佳请咨询兽医。',
      priority: 'high',
      icon: '😕',
    })
  }

  if (recentStool === 'loose') {
    advice.push({
      type: 'warning',
      title: '软便饮食建议',
      content: '建议选择易消化配方，可添加益生菌和南瓜泥帮助调理肠胃，避免突然换粮和油腻食物。',
      priority: 'high',
      icon: '💧',
    })
  } else if (recentStool === 'hard') {
    advice.push({
      type: 'supplement',
      title: '便秘饮食建议',
      content: '增加饮水量和膳食纤维，可适量添加南瓜泥、橄榄油或益生菌，湿粮比干粮更有助于缓解便秘。',
      priority: 'medium',
      icon: '💊',
    })
  }

  advice.push({
    type: 'supplement',
    title: '推荐营养补充',
    content: getSupplementAdvice(profile),
    priority: 'low',
    icon: '💊',
  })

  return advice
}

function calculateDailyCalories(profile: FeedingProfile): number {
  const { pet, weight, isPuppyKitten, isSenior, isNeutered } = profile
  const kg = weight || (pet.species === 'cat' ? 4 : 15)
  const rer = 70 * Math.pow(kg, 0.75)

  let factor = 1.6
  if (isPuppyKitten) factor = 2.5
  else if (isSenior) factor = 1.2
  else if (isNeutered) factor = 1.4

  if (pet.species === 'cat') {
    factor *= 0.9
  }

  return Math.round(rer * factor)
}

function calculateDailyAmount(profile: FeedingProfile, calories: number): number {
  const kcalPerGram = 3.8
  return Math.round(calories / kcalPerGram)
}

function getSupplementAdvice(profile: FeedingProfile): string {
  const parts: string[] = []

  if (profile.isPuppyKitten) {
    parts.push('DHA促进大脑发育')
  }

  if (profile.isSenior) {
    parts.push('葡萄糖胺/软骨素保护关节')
    parts.push('抗氧化剂（维生素E、C）')
  }

  if (profile.pet.species === 'cat') {
    parts.push('牛磺酸（猫咪必需）')
  }

  if (profile.chronicConditions.some(c => c.condition === '关节炎')) {
    parts.push('Omega-3脂肪酸抗炎')
  }

  if (profile.chronicConditions.some(c => c.condition === '慢性肾病')) {
    parts.push('Omega-3脂肪酸（遵医嘱）')
    parts.push('B族维生素')
  }

  parts.push('益生菌维护肠道健康')

  if (parts.length === 0) {
    parts.push('根据体检结果遵医嘱补充')
  }

  return parts.join('、')
}

export function getMealPlan(profile: FeedingProfile): Array<{ time: string; label: string; ratio: string }> {
  if (profile.isPuppyKitten) {
    return [
      { time: '07:00', label: '早餐', ratio: '25%' },
      { time: '12:00', label: '午餐', ratio: '25%' },
      { time: '17:00', label: '晚餐', ratio: '25%' },
      { time: '21:00', label: '夜宵', ratio: '25%' },
    ]
  }

  if (profile.isSenior) {
    return [
      { time: '08:00', label: '早餐', ratio: '40%' },
      { time: '18:00', label: '晚餐', ratio: '60%' },
    ]
  }

  return [
    { time: '08:00', label: '早餐', ratio: '40%' },
    { time: '18:00', label: '晚餐', ratio: '60%' },
  ]
}