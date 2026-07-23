const SELF_HARM_KEYWORDS: string[] = [
  '自杀', '自残', '自伤', '不想活了', '活不下去',
  '结束生命', '了结自己', '死了一了百了'
]

const ANIMAL_ABUSE_KEYWORDS: string[] = [
  '虐待', '毒杀', '下毒', '打死', '弄死', '杀猫', '杀狗',
  '安乐死自己', '怎么让宠物死'
]

const PRIVACY_PATTERNS: RegExp[] = [
  /1[3-9]\d{9}/,
  /\d{17}[\dXx]/,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
]

const TOXIC_FOOD_NAMES: string[] = [
  '巧克力', '可可', '葡萄', '洋葱', '大蒜', '木糖醇',
  '牛油果', '酒精', '咖啡', '茶', '夏威夷果', '生面团',
  '韭菜', '葱', '啤酒', '红酒', '白酒', '咖啡因',
  '百合', '郁金香', '水仙', '夹竹桃', '蓖麻'
]

export interface RuleGuardResult {
  blocked: boolean
  isCrisis: boolean
  reason?: string
  action: 'pass' | 'block' | 'crisis_intervention'
}

export function checkInput(text: string): RuleGuardResult {
  for (const kw of SELF_HARM_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        blocked: true,
        isCrisis: true,
        reason: '检测到自我伤害倾向',
        action: 'crisis_intervention'
      }
    }
  }

  for (const kw of ANIMAL_ABUSE_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        blocked: true,
        isCrisis: false,
        reason: '检测到虐待动物倾向',
        action: 'block'
      }
    }
  }

  for (const pattern of PRIVACY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        isCrisis: false,
        reason: '检测到疑似隐私信息',
        action: 'block'
      }
    }
  }

  return { blocked: false, isCrisis: false, action: 'pass' }
}

export function sanitizeOutput(text: string, maxLength: number = 150): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...'
  }
  return text
}
