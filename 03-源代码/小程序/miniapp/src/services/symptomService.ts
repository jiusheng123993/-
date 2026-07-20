import { api } from './api'
import { getStorage, setStorage } from '../utils/storage'
import { queueSync } from './syncHelper'
import type { PetHealthEntry } from './checkinService'
import type { PetProfile } from './petService'

function entryDateStr(entry: PetHealthEntry): string {
  if (entry.createdAt instanceof Date) {
    return entry.createdAt.toISOString().slice(0, 10)
  }
  return String(entry.createdAt).slice(0, 10)
}

export interface SymptomCheckResult {
  id: string
  petId: string
  symptoms: string[]
  additionalInfo?: {
    duration?: string
    frequency?: string
    appetite?: string
    energy?: string
    otherNotes?: string
  }
  riskLevel: 'normal' | 'caution' | 'warning' | 'emergency'
  possibleConditions: string[]
  aiAdvice: string
  recommendedActions: string[]
  createdAt: string
}

export interface SymptomCategory {
  id: string
  name: string
  icon: string
  symptoms: SymptomItem[]
}

export interface SymptomItem {
  id: string
  name: string
  description: string
  species: ('cat' | 'dog')[]
}

const BUILTIN_CATEGORIES: SymptomCategory[] = [
  {
    id: 'digestive',
    name: '消化系统',
    icon: 'digestive',
    symptoms: [
      { id: 'vomiting', name: '呕吐', description: '宠物出现呕吐现象', species: ['cat', 'dog'] },
      { id: 'diarrhea', name: '腹泻', description: '大便稀溏或水样', species: ['cat', 'dog'] },
      { id: 'constipation', name: '便秘', description: '排便困难或排便次数减少', species: ['cat', 'dog'] },
      { id: 'appetite_loss', name: '食欲不振', description: '对食物缺乏兴趣', species: ['cat', 'dog'] },
      { id: 'drooling', name: '流口水', description: '口腔分泌物增多', species: ['cat', 'dog'] },
      { id: 'dysphagia', name: '吞咽困难', description: '进食或饮水时吞咽费力', species: ['cat', 'dog'] },
    ],
  },
  {
    id: 'respiratory',
    name: '呼吸系统',
    icon: 'respiratory',
    symptoms: [
      { id: 'cough', name: '咳嗽', description: '阵发性或持续性咳嗽', species: ['cat', 'dog'] },
      { id: 'sneeze', name: '打喷嚏', description: '频繁打喷嚏', species: ['cat', 'dog'] },
      { id: 'runny_nose', name: '流鼻涕', description: '鼻腔分泌物增多', species: ['cat', 'dog'] },
      { id: 'dyspnea', name: '呼吸困难', description: '呼吸急促或费力', species: ['cat', 'dog'] },
      { id: 'wheezing', name: '喘息', description: '呼吸时有喘息声', species: ['cat', 'dog'] },
    ],
  },
  {
    id: 'skin',
    name: '皮肤系统',
    icon: 'skin',
    symptoms: [
      { id: 'itching', name: '瘙痒', description: '频繁抓挠身体', species: ['cat', 'dog'] },
      { id: 'hair_loss', name: '脱毛', description: '异常掉毛或斑秃', species: ['cat', 'dog'] },
      { id: 'rash', name: '红疹', description: '皮肤出现红色斑点或斑块', species: ['cat', 'dog'] },
      { id: 'dander', name: '皮屑', description: '皮肤表面出现大量皮屑', species: ['cat', 'dog'] },
      { id: 'lump', name: '肿块', description: '身体出现异常肿块', species: ['cat', 'dog'] },
      { id: 'wound', name: '伤口', description: '皮肤破损或有伤口', species: ['cat', 'dog'] },
    ],
  },
  {
    id: 'urinary',
    name: '泌尿系统',
    icon: 'urinary',
    symptoms: [
      { id: 'frequent_urination', name: '尿频', description: '排尿次数明显增多', species: ['cat', 'dog'] },
      { id: 'hematuria', name: '尿血', description: '尿液中有血液', species: ['cat', 'dog'] },
      { id: 'dysuria', name: '排尿困难', description: '排尿费力或疼痛', species: ['cat', 'dog'] },
      { id: 'incontinence', name: '尿失禁', description: '无法控制排尿', species: ['cat', 'dog'] },
    ],
  },
  {
    id: 'nervous',
    name: '神经系统',
    icon: 'nervous',
    symptoms: [
      { id: 'seizure', name: '抽搐', description: '身体不自主抽动或痉挛', species: ['cat', 'dog'] },
      { id: 'head_tilt', name: '歪头', description: '头部持续偏向一侧', species: ['cat', 'dog'] },
      { id: 'ataxia', name: '走路不稳', description: '行走时摇晃或失去平衡', species: ['cat', 'dog'] },
      { id: 'nystagmus', name: '眼球震颤', description: '眼球不自主快速运动', species: ['cat', 'dog'] },
    ],
  },
  {
    id: 'behavior',
    name: '行为异常',
    icon: 'behavior',
    symptoms: [
      { id: 'lethargy', name: '嗜睡', description: '精神萎靡、活动减少', species: ['cat', 'dog'] },
      { id: 'anxiety', name: '焦躁', description: '表现出不安或烦躁', species: ['cat', 'dog'] },
      { id: 'aggression', name: '攻击性', description: '出现异常攻击行为', species: ['cat', 'dog'] },
      { id: 'hiding', name: '躲藏', description: '频繁躲藏不愿出来', species: ['cat', 'dog'] },
      { id: 'excessive_licking', name: '过度舔舐', description: '反复舔舐身体某部位', species: ['cat', 'dog'] },
    ],
  },
  {
    id: 'eye_ear_mouth',
    name: '眼耳口鼻',
    icon: 'eye_ear_mouth',
    symptoms: [
      { id: 'eye_discharge', name: '眼屎增多', description: '眼睛分泌物异常增多', species: ['cat', 'dog'] },
      { id: 'tearing', name: '流泪', description: '眼睛流泪增多', species: ['cat', 'dog'] },
      { id: 'ear_odor', name: '耳臭', description: '耳朵有异味', species: ['cat', 'dog'] },
      { id: 'bad_breath', name: '口臭', description: '口腔有异味', species: ['cat', 'dog'] },
      { id: 'gum_swelling', name: '牙龈红肿', description: '牙龈发红肿胀', species: ['cat', 'dog'] },
    ],
  },
]

const EMERGENCY_SYMPTOMS = new Set([
  'seizure',
  'dyspnea',
  'hematuria',
  'unconsciousness',
])

const WARNING_SYMPTOM_COMBOS: { symptoms: string[]; extra?: string[] }[] = [
  { symptoms: ['vomiting', 'appetite_loss'] },
  { symptoms: ['diarrhea'], extra: ['diarrhea'] },
  { symptoms: ['frequent_urination', 'hematuria'] },
]

const CAUTION_SYMPTOMS = new Set([
  'vomiting',
  'diarrhea',
  'appetite_loss',
  'lethargy',
  'cough',
  'itching',
  'hair_loss',
  'constipation',
  'drooling',
  'sneeze',
  'runny_nose',
  'rash',
  'dander',
  'frequent_urination',
  'dysuria',
  'head_tilt',
  'ataxia',
  'anxiety',
  'hiding',
  'excessive_licking',
  'eye_discharge',
  'tearing',
  'ear_odor',
  'bad_breath',
  'gum_swelling',
])

const CONDITION_MAP: Record<string, string[]> = {
  vomiting: ['胃炎', '食物不耐受', '肠道异物'],
  diarrhea: ['肠炎', '寄生虫感染', '食物过敏'],
  constipation: ['脱水', '肠道梗阻', '饮食纤维不足'],
  appetite_loss: ['感染', '口腔疾病', '消化系统疾病'],
  drooling: ['口腔溃疡', '牙齿问题', '中毒'],
  dysphagia: ['咽喉炎', '食道异物', '神经系统疾病'],
  cough: ['呼吸道感染', '气管塌陷', '心脏病'],
  sneeze: ['上呼吸道感染', '过敏性鼻炎', '鼻腔异物'],
  runny_nose: ['鼻炎', '上呼吸道感染', '过敏'],
  dyspnea: ['肺炎', '心脏病', '气管塌陷'],
  wheezing: ['哮喘', '支气管炎', '过敏'],
  itching: ['皮肤病', '寄生虫', '过敏'],
  hair_loss: ['真菌感染', '内分泌失调', '营养不良'],
  rash: ['过敏性皮炎', '湿疹', '寄生虫叮咬'],
  dander: ['皮肤干燥', '营养不良', '寄生虫'],
  lump: ['脂肪瘤', '囊肿', '肿瘤'],
  wound: ['外伤', '感染', '自咬伤'],
  frequent_urination: ['尿路感染', '糖尿病', '肾脏疾病'],
  hematuria: ['尿路结石', '膀胱炎', '肾脏疾病'],
  dysuria: ['尿路结石', '前列腺疾病', '尿道阻塞'],
  incontinence: ['尿道括约肌松弛', '神经系统疾病', '尿路感染'],
  seizure: ['癫痫', '中毒', '脑部疾病'],
  head_tilt: ['中耳炎', '前庭疾病', '脑部疾病'],
  ataxia: ['前庭疾病', '脊髓疾病', '中毒'],
  nystagmus: ['前庭疾病', '脑部疾病', '中毒'],
  lethargy: ['感染', '贫血', '代谢疾病'],
  anxiety: ['环境变化', '疼痛', '分离焦虑'],
  aggression: ['疼痛', '恐惧', '神经系统疾病'],
  hiding: ['疼痛', '恐惧', '疾病不适'],
  excessive_licking: ['皮肤病', '过敏', '焦虑'],
  eye_discharge: ['结膜炎', '泪管堵塞', '眼部感染'],
  tearing: ['结膜炎', '过敏', '泪管堵塞'],
  ear_odor: ['耳螨', '外耳炎', '真菌感染'],
  bad_breath: ['牙结石', '口腔感染', '消化系统疾病'],
  gum_swelling: ['牙龈炎', '牙周病', '口腔感染'],
}

function getStorageKey(petId: string): string {
  return `symptom_checks_${petId}`
}

function generateId(): string {
  return `sym_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getLocalResults(petId: string): SymptomCheckResult[] {
  return getStorage<SymptomCheckResult[]>(getStorageKey(petId)) || []
}

function saveLocalResults(petId: string, results: SymptomCheckResult[]): void {
  setStorage(getStorageKey(petId), results)
}

function calculateRiskLevel(
  symptomIds: string[],
  additionalInfo?: SymptomCheckResult['additionalInfo']
): SymptomCheckResult['riskLevel'] {
  const hasEmergency = symptomIds.some((id) => EMERGENCY_SYMPTOMS.has(id))

  if (hasEmergency) {
    return 'emergency'
  }

  if (symptomIds.includes('vomiting') && symptomIds.includes('diarrhea')) {
    return 'emergency'
  }

  if (symptomIds.includes('vomiting') && symptomIds.includes('lethargy')) {
    return 'emergency'
  }

  if (symptomIds.includes('dyspnea') && symptomIds.includes('lethargy')) {
    return 'emergency'
  }

  for (const combo of WARNING_SYMPTOM_COMBOS) {
    const allMatch = combo.symptoms.every((s) => symptomIds.includes(s))
    if (allMatch) {
      if (combo.extra) {
        const duration = additionalInfo?.duration
        if (duration && (duration === '2-3天' || duration === '3天以上')) {
          return 'warning'
        }
        continue
      }
      return 'warning'
    }
  }

  if (symptomIds.includes('vomiting') && additionalInfo?.appetite === 'decreased') {
    return 'warning'
  }

  if (symptomIds.includes('diarrhea') && additionalInfo?.appetite === 'decreased') {
    return 'warning'
  }

  if (symptomIds.includes('lethargy') && additionalInfo?.energy === 'low') {
    return 'warning'
  }

  const hasCaution = symptomIds.some((id) => CAUTION_SYMPTOMS.has(id))
  if (hasCaution) {
    return 'caution'
  }

  return 'normal'
}

function generateAiAdvice(
  symptomIds: string[],
  riskLevel: SymptomCheckResult['riskLevel'],
  additionalInfo?: SymptomCheckResult['additionalInfo']
): string {
  const symptomNames = symptomIds
    .map((id) => {
      for (const cat of BUILTIN_CATEGORIES) {
        const found = cat.symptoms.find((s) => s.id === id)
        if (found) return found.name
      }
      return id
    })
    .filter(Boolean)

  const symptomText = symptomNames.length > 0 ? `检测到以下症状：${symptomNames.join('、')}。` : ''

  switch (riskLevel) {
    case 'emergency':
      return `🚨 紧急！${symptomText}这些症状可能表明严重健康问题，请立即带宠物前往最近的宠物医院就诊。途中保持宠物安静，避免剧烈晃动。`
    case 'warning':
      return `⚠️ 需要关注！${symptomText}建议在24小时内带宠物就医检查。期间密切观察症状变化，如出现恶化请立即就医。`
    case 'caution':
      return `💡 注意观察。${symptomText}建议持续观察宠物状态，如症状持续超过24小时或出现新的异常，请及时就医。`
    case 'normal':
      return `✅ 目前未检测到明显异常症状。${additionalInfo?.otherNotes ? '已记录您的补充信息。' : ''}请继续保持良好的日常护理，定期体检。`
  }
}

function generatePossibleConditions(symptomIds: string[]): string[] {
  const conditions = new Set<string>()
  for (const id of symptomIds) {
    const mapped = CONDITION_MAP[id]
    if (mapped) {
      for (const c of mapped) {
        conditions.add(c)
      }
    }
  }
  return Array.from(conditions).slice(0, 5)
}

function generateRecommendedActions(riskLevel: SymptomCheckResult['riskLevel']): string[] {
  switch (riskLevel) {
    case 'emergency':
      return [
        '立即前往最近的24小时宠物医院',
        '途中保持宠物安静平躺',
        '准备好宠物病历和基本信息',
        '如呼吸困难，保持通风',
      ]
    case 'warning':
      return [
        '预约24小时内的兽医门诊',
        '记录症状出现的时间和频率',
        '暂时禁食观察（如涉及消化症状）',
        '准备宠物近期饮食和活动记录',
      ]
    case 'caution':
      return [
        '持续观察宠物状态24小时',
        '记录症状变化情况',
        '保持正常饮食和饮水',
        '如症状加重请及时就医',
      ]
    case 'normal':
      return [
        '保持日常护理习惯',
        '定期进行健康检查',
        '注意饮食均衡和适量运动',
        '关注宠物日常行为变化',
      ]
  }
}

export function getSymptomCategories(species?: 'cat' | 'dog'): SymptomCategory[] {
  if (!species) {
    return BUILTIN_CATEGORIES
  }
  return BUILTIN_CATEGORIES.map((cat) => ({
    ...cat,
    symptoms: cat.symptoms.filter((s) => s.species.includes(species)),
  })).filter((cat) => cat.symptoms.length > 0)
}

export function getSymptomsByCategory(categoryId: string): SymptomItem[] {
  const category = BUILTIN_CATEGORIES.find((c) => c.id === categoryId)
  return category ? category.symptoms : []
}

export function searchSymptoms(keyword: string, species?: 'cat' | 'dog'): SymptomItem[] {
  const lowerKeyword = keyword.toLowerCase()
  const results: SymptomItem[] = []

  for (const cat of BUILTIN_CATEGORIES) {
    for (const symptom of cat.symptoms) {
      const nameMatch = symptom.name.includes(keyword)
      const descMatch = symptom.description.includes(keyword)
      const idMatch = symptom.id.toLowerCase().includes(lowerKeyword)

      if (nameMatch || descMatch || idMatch) {
        if (!species || symptom.species.includes(species)) {
          if (!results.find((r) => r.id === symptom.id)) {
            results.push(symptom)
          }
        }
      }
    }
  }

  return results
}

function getRecentCheckins(petId: string, days: number = 7): PetHealthEntry[] {
  const key = `xhh_checkins_${petId}`
  const all = getStorage<PetHealthEntry[]>(key.replace('xhh_', '')) || []
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return all.filter((e) => entryDateStr(e) >= cutoffStr)
}

function applyPersonalizedAdjustments(
  riskLevel: SymptomCheckResult['riskLevel'],
  symptomIds: string[],
  petProfile?: PetProfile,
  recentCheckins?: PetHealthEntry[]
): SymptomCheckResult['riskLevel'] {
  if (!petProfile && (!recentCheckins || recentCheckins.length === 0)) {
    return riskLevel
  }

  let adjusted = riskLevel

  if (recentCheckins && recentCheckins.length > 0) {
    const abnormalCount = recentCheckins.filter(
      (e) => e.riskLevel === 'high' || e.riskLevel === 'emergency'
    ).length
    const vomitingDays = recentCheckins.filter((e) => e.anomalyItems.includes('other')).length
    const appetiteDownDays = recentCheckins.filter(
      (e) => e.appetiteLevel <= 2
    ).length
    const stoolAbnormalDays = recentCheckins.filter(
      (e) => e.poopLevel <= 2 || e.poopLevel >= 4
    ).length

    if (abnormalCount >= 3 && adjusted === 'caution') {
      adjusted = 'warning'
    }

    if (vomitingDays >= 2 && symptomIds.includes('vomiting') && adjusted === 'caution') {
      adjusted = 'warning'
    }

    if (appetiteDownDays >= 3 && symptomIds.includes('appetite_loss') && adjusted === 'caution') {
      adjusted = 'warning'
    }

    if (stoolAbnormalDays >= 3 && (symptomIds.includes('diarrhea') || symptomIds.includes('constipation')) && adjusted === 'caution') {
      adjusted = 'warning'
    }
  }

  if (petProfile) {
    const birth = new Date(petProfile.birthDate + 'T00:00:00.000Z')
    const now = new Date()
    const ageInMonths =
      (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - birth.getUTCMonth())

    if (ageInMonths < 6 && adjusted === 'caution') {
      adjusted = 'warning'
    }

    if (ageInMonths >= 120 && adjusted === 'caution') {
      adjusted = 'warning'
    }
  }

  return adjusted
}

function generatePersonalizedAdvice(
  baseAdvice: string,
  petProfile?: PetProfile,
  recentCheckins?: PetHealthEntry[]
): string {
  const extras: string[] = []

  if (petProfile) {
    const birth = new Date(petProfile.birthDate + 'T00:00:00.000Z')
    const now = new Date()
    const ageInMonths =
      (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - birth.getUTCMonth())

    if (ageInMonths < 6) {
      extras.push(`${petProfile.name}还是幼年（约${ageInMonths}个月），幼年宠物免疫力较低，建议格外注意。`)
    } else if (ageInMonths >= 120) {
      extras.push(`${petProfile.name}已是老年宠物（约${Math.floor(ageInMonths / 12)}岁），老年宠物恢复能力较弱，建议及时就医。`)
    }

    if (petProfile.species === 'cat') {
      extras.push('猫咪善于隐藏不适，表面症状可能比实际病情轻，请密切观察。')
    }
  }

  if (recentCheckins && recentCheckins.length > 0) {
    const abnormalDays = recentCheckins.filter(
      (e) => e.riskLevel !== 'low'
    ).length
    if (abnormalDays >= 3) {
      extras.push(`近${recentCheckins.length}天打卡中有${abnormalDays}天异常，建议尽快就医排查。`)
    }
  }

  if (extras.length === 0) {
    return baseAdvice
  }

  return `${baseAdvice}\n\n📋 个性化提示：${extras.join('')}`
}

export async function analyzeSymptoms(
  petId: string,
  symptoms: string[],
  additionalInfo?: SymptomCheckResult['additionalInfo'],
  petProfile?: PetProfile
): Promise<SymptomCheckResult> {
  const recentCheckins = getRecentCheckins(petId)
  const baseRiskLevel = calculateRiskLevel(symptoms, additionalInfo)
  const riskLevel = applyPersonalizedAdjustments(baseRiskLevel, symptoms, petProfile, recentCheckins)
  const possibleConditions = generatePossibleConditions(symptoms)
  const baseAdvice = generateAiAdvice(symptoms, riskLevel, additionalInfo)
  const aiAdvice = generatePersonalizedAdvice(baseAdvice, petProfile, recentCheckins)
  const recommendedActions = generateRecommendedActions(riskLevel)

  const result: SymptomCheckResult = {
    id: generateId(),
    petId,
    symptoms,
    additionalInfo,
    riskLevel,
    possibleConditions,
    aiAdvice,
    recommendedActions,
    createdAt: new Date().toISOString(),
  }

  try {
    const apiResult = await api.post<SymptomCheckResult>(
      `/api/pets/${petId}/symptom-checks`,
      result
    )
    const local = getLocalResults(petId)
    local.unshift(apiResult)
    saveLocalResults(petId, local)
    return apiResult
  } catch (error) {
    const local = getLocalResults(petId)
    local.unshift(result)
    saveLocalResults(petId, local)
    return result
  }
}

export async function getCheckHistory(petId: string): Promise<SymptomCheckResult[]> {
  try {
    const result = await api.get<SymptomCheckResult[]>(`/api/pets/${petId}/symptom-checks`)
    saveLocalResults(petId, result)
    return result
  } catch (error) {
    return getLocalResults(petId)
  }
}

export async function getCheckResult(id: string): Promise<SymptomCheckResult | null> {
  try {
    const result = await api.get<SymptomCheckResult>(`/api/symptom-checks/${id}`)
    return result
  } catch (error) {
    return null
  }
}

export async function deleteCheckResult(id: string): Promise<void> {
  try {
    await api.delete(`/api/symptom-checks/${id}`)
  } catch (error) {
  }
}