# 订阅消息频次控制 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现订阅消息频次控制，防止用户被过多消息打扰，支持按模板ID设置最小发送间隔、每日/每周上限，以及用户自定义免打扰时段。

**Architecture:** 在 subscribeService 中新增频率控制层，基于本地存储记录每条模板的发送历史，在发送前检查频率限制。新增频率配置服务和用户偏好设置。

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand

---

## 文件结构

```
03-源代码/小程序/miniapp/src/
├── services/
│   ├── subscribeService.ts          # 已有，需集成频率检查
│   └── notificationService.ts      # 已有，需集成频率检查
│   └── frequencyControlService.ts  # 新增：频率控制核心逻辑
├── stores/
│   └── subscribeStore.ts           # 已有，需扩展频率相关状态
│   └── settingsStore.ts            # 已有，需扩展免打扰设置
├── types/
│   └── frequencyTypes.ts           # 新增：频率控制类型定义
└── utils/
    └── __tests__/frequencyControlService.test.ts  # 新增：测试
```

---

## Task 1: 创建频率控制类型定义

**Files:**
- Create: `03-源代码/小程序/miniapp/src/types/frequencyTypes.ts`

- [ ] **Step 1: 定义频率规则类型**

```typescript
export type TimeWindow = 'minute' | 'hour' | 'day' | 'week' | 'month'

export interface FrequencyRule {
  templateId: string
  minInterval: number // 最小间隔（分钟）
  dailyLimit: number // 每日上限
  weeklyLimit: number // 每周上限
  monthlyLimit: number // 每月上限
  enabled: boolean // 是否启用
}

export interface SendRecord {
  templateId: string
  sentAt: number // 时间戳
  success: boolean
}

export interface DoNotDisturbSetting {
  enabled: boolean
  startHour: number // 0-23
  startMinute: number // 0-59
  endHour: number
  endMinute: number
  timezone: string
}

export interface FrequencyControlConfig {
  defaultRules: FrequencyRule[]
  userRules: Record<string, FrequencyRule> // key: templateId
  sendHistory: SendRecord[]
  doNotDisturb: DoNotDisturbSetting
  globalDailyLimit: number // 所有消息合计每日上限
  globalWeeklyLimit: number
}

export interface FrequencyCheckResult {
  allowed: boolean
  reason?: string
  nextAllowedAt?: number
  remainingToday?: number
  remainingThisWeek?: number
}
```

- [ ] **Step 2: 验证类型文件**

Run: `npm run typecheck`
Expected: 无新增错误

---

## Task 2: 创建频率控制核心服务

**Files:**
- Create: `03-源代码/小程序/miniapp/src/services/frequencyControlService.ts`

- [ ] **Step 1: 实现频率控制服务**

```typescript
import { getStorage, setStorage } from '../utils/storage'
import {
  type FrequencyRule,
  type SendRecord,
  type DoNotDisturbSetting,
  type FrequencyCheckResult,
  type FrequencyControlConfig,
} from '../types/frequencyTypes'

const FREQUENCY_CONFIG_KEY = 'frequency_control_config'

const DEFAULT_RULES: FrequencyRule[] = [
  {
    templateId: 'FOLLOWUP_TEMPLATE_ID_PLACEHOLDER',
    minInterval: 60, // 1小时
    dailyLimit: 3,
    weeklyLimit: 7,
    monthlyLimit: 20,
    enabled: true,
  },
  {
    templateId: 'INTERVENTION_REMINDER_TEMPLATE_ID_PLACEHOLDER',
    minInterval: 30, // 30分钟
    dailyLimit: 5,
    weeklyLimit: 15,
    monthlyLimit: 50,
    enabled: true,
  },
  {
    templateId: 'MOOD_CHECKIN_TEMPLATE_ID_PLACEHOLDER',
    minInterval: 120, // 2小时
    dailyLimit: 2,
    weeklyLimit: 7,
    monthlyLimit: 30,
    enabled: true,
  },
]

const DEFAULT_CONFIG: FrequencyControlConfig = {
  defaultRules: DEFAULT_RULES,
  userRules: {},
  sendHistory: [],
  doNotDisturb: {
    enabled: false,
    startHour: 22,
    startMinute: 0,
    endHour: 8,
    endMinute: 0,
    timezone: 'Asia/Shanghai',
  },
  globalDailyLimit: 10,
  globalWeeklyLimit: 30,
}

function getConfig(): FrequencyControlConfig {
  return getStorage<FrequencyControlConfig>(FREQUENCY_CONFIG_KEY) || DEFAULT_CONFIG
}

function saveConfig(config: FrequencyControlConfig): void {
  setStorage(FREQUENCY_CONFIG_KEY, config)
}

function getNow(): Date {
  return new Date()
}

function isInDoNotDisturb(setting: DoNotDisturbSetting): boolean {
  if (!setting.enabled) return false

  const now = getNow()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const startTime = setting.startHour * 60 + setting.startMinute
  const endTime = setting.endHour * 60 + setting.endMinute

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime
  } else {
    // 跨天的情况，如 22:00 - 08:00
    return currentTime >= startTime || currentTime < endTime
  }
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 周一为周开始
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getFrequencyRule(templateId: string): FrequencyRule {
  const config = getConfig()
  return (
    config.userRules[templateId] ||
    config.defaultRules.find((r) => r.templateId === templateId) ||
    DEFAULT_RULES[0]
  )
}

export function setFrequencyRule(templateId: string, rule: Partial<FrequencyRule>): void {
  const config = getConfig()
  const existing = config.userRules[templateId] || config.defaultRules.find((r) => r.templateId === templateId)

  config.userRules[templateId] = {
    ...(existing || DEFAULT_RULES[0]),
    ...rule,
    templateId,
  }

  saveConfig(config)
}

export function recordSend(templateId: string, success: boolean): void {
  const config = getConfig()
  config.sendHistory.push({
    templateId,
    sentAt: Date.now(),
    success,
  })

  // 只保留最近90天的记录
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  config.sendHistory = config.sendHistory.filter((r) => r.sentAt > ninetyDaysAgo)

  saveConfig(config)
}

export function checkFrequency(templateId: string): FrequencyCheckResult {
  const config = getConfig()

  // 检查免打扰时段
  if (isInDoNotDisturb(config.doNotDisturb)) {
    const { endHour, endMinute } = config.doNotDisturb
    const now = getNow()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(endHour, endMinute, 0, 0)

    return {
      allowed: false,
      reason: '当前处于免打扰时段',
      nextAllowedAt: tomorrow.getTime(),
    }
  }

  const rule = getFrequencyRule(templateId)

  if (!rule.enabled) {
    return {
      allowed: false,
      reason: '该消息类型已禁用',
    }
  }

  const now = getNow()
  const nowTime = now.getTime()

  // 检查最小间隔
  const recentSends = config.sendHistory.filter(
    (r) => r.templateId === templateId && r.sentAt > nowTime - rule.minInterval * 60 * 1000
  )

  if (recentSends.length > 0) {
    const lastSend = recentSends[recentSends.length - 1]
    const nextAllowed = lastSend.sentAt + rule.minInterval * 60 * 1000
    return {
      allowed: false,
      reason: `发送过于频繁，最小间隔为 ${rule.minInterval} 分钟`,
      nextAllowedAt: nextAllowed,
    }
  }

  // 检查每日限制
  const startOfDay = getStartOfDay(now).getTime()
  const todaySends = config.sendHistory.filter(
    (r) => r.templateId === templateId && r.sentAt >= startOfDay
  )

  if (todaySends.length >= rule.dailyLimit) {
    const tomorrow = new Date(startOfDay)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      allowed: false,
      reason: `今日发送已达上限 (${rule.dailyLimit} 条)`,
      nextAllowedAt: tomorrow.getTime(),
      remainingToday: 0,
    }
  }

  // 检查每周限制
  const startOfWeek = getStartOfWeek(now).getTime()
  const weekSends = config.sendHistory.filter(
    (r) => r.templateId === templateId && r.sentAt >= startOfWeek
  )

  if (weekSends.length >= rule.weeklyLimit) {
    const nextWeek = new Date(startOfWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return {
      allowed: false,
      reason: `本周发送已达上限 (${rule.weeklyLimit} 条)`,
      nextAllowedAt: nextWeek.getTime(),
      remainingThisWeek: 0,
    }
  }

  // 检查全局每日限制
  const globalTodaySends = config.sendHistory.filter((r) => r.sentAt >= startOfDay)
  if (globalTodaySends.length >= config.globalDailyLimit) {
    const tomorrow = new Date(startOfDay)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      allowed: false,
      reason: `今日总消息数已达上限 (${config.globalDailyLimit} 条)`,
      nextAllowedAt: tomorrow.getTime(),
    }
  }

  // 检查全局每周限制
  const globalWeekSends = config.sendHistory.filter((r) => r.sentAt >= startOfWeek)
  if (globalWeekSends.length >= config.globalWeeklyLimit) {
    const nextWeek = new Date(startOfWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return {
      allowed: false,
      reason: `本周总消息数已达上限 (${config.globalWeeklyLimit} 条)`,
      nextAllowedAt: nextWeek.getTime(),
    }
  }

  return {
    allowed: true,
    remainingToday: rule.dailyLimit - todaySends.length - 1,
    remainingThisWeek: rule.weeklyLimit - weekSends.length - 1,
  }
}

export function getSendStats(templateId?: string): {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
} {
  const config = getConfig()
  const now = getNow()
  const startOfDay = getStartOfDay(now).getTime()
  const startOfWeek = getStartOfWeek(now).getTime()
  const startOfMonth = getStartOfMonth(now).getTime()

  const records = templateId
    ? config.sendHistory.filter((r) => r.templateId === templateId)
    : config.sendHistory

  return {
    today: records.filter((r) => r.sentAt >= startOfDay).length,
    thisWeek: records.filter((r) => r.sentAt >= startOfWeek).length,
    thisMonth: records.filter((r) => r.sentAt >= startOfMonth).length,
    total: records.length,
  }
}

export function setDoNotDisturb(setting: Partial<DoNotDisturbSetting>): void {
  const config = getConfig()
  config.doNotDisturb = { ...config.doNotDisturb, ...setting }
  saveConfig(config)
}

export function getDoNotDisturbSetting(): DoNotDisturbSetting {
  return getConfig().doNotDisturb
}

export function clearSendHistory(): void {
  const config = getConfig()
  config.sendHistory = []
  saveConfig(config)
}

export function resetToDefaultRules(): void {
  const config = getConfig()
  config.userRules = {}
  config.sendHistory = []
  saveConfig(config)
}
```

- [ ] **Step 2: 创建测试文件**

Create: `03-源代码/小程序/miniapp/src/utils/__tests__/frequencyControlService.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkFrequency,
  recordSend,
  getFrequencyRule,
  setFrequencyRule,
  getSendStats,
  setDoNotDisturb,
  getDoNotDisturbSetting,
  clearSendHistory,
  resetToDefaultRules,
} from '../../services/frequencyControlService'

describe('frequencyControlService', () => {
  beforeEach(() => {
    clearSendHistory()
    resetToDefaultRules()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow first send', () => {
    const result = checkFrequency('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(result.allowed).toBe(true)
    expect(result.remainingToday).toBeGreaterThan(0)
  })

  it('should block send within min interval', () => {
    recordSend('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', true)
    const result = checkFrequency('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('频繁')
  })

  it('should allow send after min interval', () => {
    recordSend('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', true)
    vi.advanceTimersByTime(61 * 60 * 1000) // 61分钟
    const result = checkFrequency('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(result.allowed).toBe(true)
  })

  it('should block when daily limit reached', () => {
    const rule = getFrequencyRule('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    for (let i = 0; i < rule.dailyLimit; i++) {
      recordSend('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', true)
    }
    const result = checkFrequency('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('今日')
  })

  it('should block during do not disturb', () => {
    setDoNotDisturb({ enabled: true, startHour: 0, startMinute: 0, endHour: 23, endMinute: 59 })
    const result = checkFrequency('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('免打扰')
  })

  it('should get correct send stats', () => {
    recordSend('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', true)
    recordSend('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', true)
    const stats = getSendStats('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(stats.today).toBe(2)
    expect(stats.total).toBe(2)
  })

  it('should update frequency rule', () => {
    setFrequencyRule('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', { dailyLimit: 5 })
    const rule = getFrequencyRule('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(rule.dailyLimit).toBe(5)
  })

  it('should respect disabled rule', () => {
    setFrequencyRule('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER', { enabled: false })
    const result = checkFrequency('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('禁用')
  })
})
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- --run src/utils/__tests__/frequencyControlService.test.ts`
Expected: 所有测试通过

---

## Task 3: 集成频率检查到订阅服务

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/services/subscribeService.ts`
- Modify: `03-源代码/小程序/miniapp/src/services/notificationService.ts`

- [ ] **Step 1: 修改 subscribeService.ts 集成频率控制**

在 `subscribeService.ts` 中导入频率控制服务，并在 `sendSubscribeMessage` 函数中添加频率检查：

```typescript
import { checkFrequency, recordSend } from './frequencyControlService'

// 修改 sendSubscribeMessage 函数
export async function sendSubscribeMessage(
  templateId: string,
  data: SubscribeMessageData,
  page?: string
): Promise<boolean> {
  if (!hasAcceptedSubscribe(templateId)) {
    return false
  }

  if (templateId.includes('PLACEHOLDER')) {
    return false
  }

  // 频率检查
  const freqCheck = checkFrequency(templateId)
  if (!freqCheck.allowed) {
    console.warn(`[subscribeService] Frequency check failed: ${freqCheck.reason}`)
    return false
  }

  try {
    const token = Taro.getStorageSync('xhh_token')
    const apiBaseUrl = process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000'

    const res = await Taro.request({
      url: `${apiBaseUrl}/api/subscribe/send`,
      method: 'POST',
      data: { templateId, data, page },
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.statusCode === 200) {
      recordTemplateUsage(templateId)
      recordSend(templateId, true) // 记录发送成功
      return true
    }

    recordSend(templateId, false) // 记录发送失败
    return false
  } catch {
    recordSend(templateId, false)
    return false
  }
}
```

- [ ] **Step 2: 修改 notificationService.ts 集成频率控制**

在 `notificationService.ts` 中，修改 `sendFollowupNotifications` 函数，在发送前检查频率：

```typescript
import { checkFrequency, recordSend } from './frequencyControlService'

// 修改 sendFollowupNotifications 函数
async function sendFollowupNotifications(followups: PendingFollowup[]): Promise<void> {
  for (const followup of followups) {
    try {
      // 频率检查
      const freqCheck = checkFrequency(FOLLOWUP_TEMPLATE_ID)
      if (!freqCheck.allowed) {
        console.warn(`[notificationService] Followup blocked: ${freqCheck.reason}`)
        followup.status = 'cancelled'
        continue
      }

      const sent = await sendSingleFollowup(followup)
      followup.sendAttempts++
      followup.lastAttemptAt = Date.now()

      if (sent) {
        followup.status = 'sent'
        recordSend(FOLLOWUP_TEMPLATE_ID, true)
      } else {
        if (followup.sendAttempts >= 3) {
          followup.status = 'expired'
        } else {
          const retryDelay = Math.pow(2, followup.sendAttempts) * 60 * 60 * 1000
          const retryDate = new Date(Date.now() + retryDelay)
          followup.scheduledDate = retryDate.toISOString()
        }
      }
    } catch (error) {
      followup.sendAttempts++
      followup.lastAttemptAt = Date.now()
    }
  }

  setStorage(PENDING_FOLLOWUPS_KEY, followups)
}
```

- [ ] **Step 3: 运行类型检查**

Run: `npm run typecheck`
Expected: 无错误

---

## Task 4: 扩展设置页面添加频率控制UI

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/pages/settings/index.tsx`

- [ ] **Step 1: 添加频率控制设置UI**

在设置页面添加订阅消息频率控制选项：

```tsx
// 添加导入
import {
  getFrequencyRule,
  setFrequencyRule,
  getDoNotDisturbSetting,
  setDoNotDisturb,
  getSendStats,
  resetToDefaultRules,
} from '../../services/frequencyControlService'
import type { FrequencyRule, DoNotDisturbSetting } from '../../types/frequencyTypes'

// 在设置页面中添加状态
const [frequencyRules, setFrequencyRules] = useState<Record<string, FrequencyRule>>({})
const [doNotDisturb, setDoNotDisturbState] = useState<DoNotDisturbSetting>(getDoNotDisturbSetting())
const [sendStats, setSendStats] = useState({ today: 0, thisWeek: 0 })

// 添加设置项
<View className="settings-section">
  <Text className="settings-section-title">消息频率控制</Text>
  
  <View className="settings-item">
    <View className="settings-item-info">
      <Text className="settings-item-label">今日发送统计</Text>
      <Text className="settings-item-desc">{sendStats.today} 条 / 今日上限 {sendStats.todayLimit}</Text>
    </View>
  </View>

  <View className="settings-item">
    <View className="settings-item-info">
      <Text className="settings-item-label">本周发送统计</Text>
      <Text className="settings-item-desc">{sendStats.thisWeek} 条 / 本周上限 {sendStats.thisWeekLimit}</Text>
    </View>
  </View>

  <View className="settings-item">
    <View className="settings-item-info">
      <Text className="settings-item-label">免打扰模式</Text>
      <Text className="settings-item-desc">
        {doNotDisturb.enabled 
          ? `${doNotDisturb.startHour}:${String(doNotDisturb.startMinute).padStart(2, '0')} - ${doNotDisturb.endHour}:${String(doNotDisturb.endMinute).padStart(2, '0')}`
          : '已关闭'}
      </Text>
    </View>
    <Switch
      checked={doNotDisturb.enabled}
      onChange={(e) => handleDoNotDisturbChange(e.detail.value)}
    />
  </View>

  <View className="settings-item" onClick={handleResetFrequency}>
    <View className="settings-item-info">
      <Text className="settings-item-label">重置频率规则</Text>
      <Text className="settings-item-desc">恢复默认设置</Text>
    </View>
    <Text className="settings-arrow">›</Text>
  </View>
</View>
```

- [ ] **Step 2: 添加处理函数**

```typescript
const handleDoNotDisturbChange = useCallback((enabled: boolean) => {
  const newSetting = { ...doNotDisturb, enabled }
  setDoNotDisturb(newSetting)
  setDoNotDisturbState(newSetting)
  Taro.showToast({ title: enabled ? '免打扰已开启' : '免打扰已关闭', icon: 'none' })
}, [doNotDisturb])

const handleResetFrequency = useCallback(() => {
  Taro.showModal({
    title: '确认重置',
    content: '是否恢复默认频率规则？',
    success: (res) => {
      if (res.confirm) {
        resetToDefaultRules()
        setSendStats(getSendStats())
        Taro.showToast({ title: '已重置', icon: 'success' })
      }
    },
  })
}, [])
```

---

## Task 5: 扩展订阅状态存储

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/stores/subscribeStore.ts`

- [ ] **Step 1: 添加频率相关状态和方法**

```typescript
import {
  checkFrequency,
  getSendStats,
  getDoNotDisturbSetting,
  setDoNotDisturb,
  type FrequencyCheckResult,
  type DoNotDisturbSetting,
} from '../services/frequencyControlService'

interface SubscribeStoreState {
  // ... 现有状态
  frequencyStats: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
  doNotDisturb: DoNotDisturbSetting
  lastFrequencyCheck: FrequencyCheckResult | null
}

// 添加方法
  checkFrequency: (templateId: string) => FrequencyCheckResult
  refreshFrequencyStats: () => void
  updateDoNotDisturb: (setting: Partial<DoNotDisturbSetting>) => void

// 实现
  checkFrequency: (templateId: string) => {
    const result = checkFrequency(templateId)
    set({ lastFrequencyCheck: result })
    return result
  },

  refreshFrequencyStats: () => {
    const stats = getSendStats()
    set({ frequencyStats: stats })
  },

  updateDoNotDisturb: (setting: Partial<DoNotDisturbSetting>) => {
    setDoNotDisturb(setting)
    set({ doNotDisturb: getDoNotDisturbSetting() })
  },
```

---

## Task 6: 运行完整测试

- [ ] **Step 1: 运行所有测试**

Run: `npm test -- --run`
Expected: 所有测试通过

- [ ] **Step 2: 运行类型检查**

Run: `npm run typecheck`
Expected: 零错误

---

## 验收标准

1. ✅ 订阅消息发送前自动检查频率限制
2. ✅ 支持最小发送间隔控制（默认1小时）
3. ✅ 支持每日/每周/每月上限控制
4. ✅ 支持用户自定义免打扰时段
5. ✅ 发送历史持久化存储
6. ✅ 设置页面可查看和修改频率规则
7. ✅ 类型安全，TypeScript编译零错误
8. ✅ 单元测试覆盖核心逻辑
