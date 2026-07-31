export interface ChronicRecord {
  id: string
  petId: string
  condition: string
  diagnosedDate: string
  severity: 'mild' | 'moderate' | 'severe'
  status: 'active' | 'managed' | 'resolved'
  medications: string[]
  vetName: string
  vetContact: string
  nextCheckupDate: string
  notes: string
  symptoms: string[]
  createdAt: string
  updatedAt: string
}

export interface ChronicStats {
  active: number
  managed: number
  resolved: number
  total: number
  overdueCheckups: number
}

export interface ChronicTrendPoint {
  date: string
  conditions: string[]
  severityCounts: Record<string, number>
}

/** 复查提醒 */
export interface CheckupReminder {
  record: ChronicRecord
  daysUntil: number
  isOverdue: boolean
}

export const CHRONIC_COMMON_CONDITIONS = [
  '慢性肾病',
  '心脏病',
  '糖尿病',
  '甲状腺功能减退',
  '关节炎',
  '皮肤病',
  '过敏性皮炎',
  '胰腺炎',
  '肝病',
  '牙周病',
  '肥胖症',
  '泌尿道结石',
  '髋关节发育不良',
  '白内障',
  '癫痫',
] as const

export const CHRONIC_SEVERITY_MAP = {
  mild: { label: '轻度', color: '#52c41a' },
  moderate: { label: '中度', color: '#faad14' },
  severe: { label: '重度', color: '#f5222d' },
} as const

/** 慢性病状态映射（颜色和标签） */
export const CHRONIC_STATUS_MAP = {
  active: { label: '活跃中', color: '#1890ff' },
  managed: { label: '已控制', color: '#52c41a' },
  resolved: { label: '已康复', color: '#8c8c8c' },
} as const
