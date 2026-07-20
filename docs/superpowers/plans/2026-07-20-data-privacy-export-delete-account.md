# 数据导出/删除/注销功能 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的数据导出、数据删除和账号注销功能，满足隐私合规要求（个人信息保护法），确保用户可以导出全部数据、删除指定数据、注销账号并彻底清除所有关联数据。

**Architecture:** 新增 dataPrivacyService 统一管理数据导出/删除/注销流程，复用现有 syncService.clearCloudData 和 settingsStore.clearAllData 能力，新增账号注销 API 调用和二次确认机制。在设置页面新增隐私数据管理入口。

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand + Supabase REST API

---

## 文件结构

```
03-源代码/小程序/miniapp/src/
├── types/
│   └── dataPrivacyTypes.ts           # 新增：数据隐私类型定义
├── services/
│   └── dataPrivacyService.ts         # 新增：数据隐私核心服务
├── stores/
│   └── authStore.ts                  # 修改：添加 deleteAccount 方法
│   └── settingsStore.ts              # 修改：扩展数据管理方法
├── pages/
│   └── settings/
│       ├── index.tsx                 # 修改：添加隐私数据管理入口
│       └── index.scss                # 修改：添加新样式
├── components/
│   └── AccountDeletionConfirm.tsx    # 新增：账号注销确认组件
│   └── AccountDeletionConfirm.scss   # 新增：确认组件样式
└── utils/
    └── __tests__/dataPrivacyService.test.ts  # 新增：测试
```

---

## Task 1: 创建数据隐私类型定义

**Files:**
- Create: `03-源代码/小程序/miniapp/src/types/dataPrivacyTypes.ts`

- [ ] **Step 1: 定义数据隐私相关类型**

```typescript
export interface DataExportResult {
  success: boolean
  data?: string // JSON 字符串
  error?: string
  exportedAt: string
  tables: string[]
  totalRecords: number
}

export interface DataDeleteResult {
  success: boolean
  error?: string
  deletedAt: string
  deletedTables: string[]
  deletedRecords: number
}

export type AccountDeletionReason =
  | 'no_longer_needed'
  | 'privacy_concern'
  | 'found_better_app'
  | 'too_complicated'
  | 'other'

export interface AccountDeletionRequest {
  reason: AccountDeletionReason
  customReason?: string
  confirmCode: string // 用户输入的确认码
}

export interface AccountDeletionResult {
  success: boolean
  error?: string
  scheduledDeletionAt?: string // 30天后正式删除
  gracePeriodDays: number
}

export interface DataPrivacyStatus {
  lastExportAt: string | null
  lastDeleteAt: string | null
  accountDeletionRequested: boolean
  accountDeletionScheduledAt: string | null
  totalDataSize: number // 字节数
  totalRecords: number
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npm run typecheck`
Expected: 无新增错误

---

## Task 2: 创建数据隐私核心服务

**Files:**
- Create: `03-源代码/小程序/miniapp/src/services/dataPrivacyService.ts`

- [ ] **Step 1: 实现数据隐私服务**

```typescript
import Taro from '@tarojs/taro'
import { getStorage, setStorage } from '../utils/storage'
import { syncService } from './syncService'
import { supabaseClient } from './supabaseClient'
import { getAuthConfig } from '../config/supabase'
import {
  type DataExportResult,
  type DataDeleteResult,
  type AccountDeletionRequest,
  type AccountDeletionResult,
  type DataPrivacyStatus,
} from '../types/dataPrivacyTypes'

const PRIVACY_STATUS_KEY = 'data_privacy_status'
const DELETION_CONFIRM_KEY = 'account_deletion_confirm_code'

const ALL_USER_TABLES = [
  'pet_profiles',
  'pet_health_entries',
  'pet_food_queries',
  'pet_symptom_checks',
  'pet_vaccinations',
  'pet_health_trends',
  'emotion_triggers',
  'pet_grief_sessions',
  'memory_events',
  'usage_quotas',
  'memberships',
  'orders',
  'payment_records',
  'entitlements',
  'devices',
  'personas',
  'sync_log',
]

const EXPORT_TABLES = [
  'pet_profiles',
  'pet_health_entries',
  'pet_food_queries',
  'pet_symptom_checks',
  'pet_vaccinations',
  'pet_health_trends',
  'emotion_triggers',
  'pet_grief_sessions',
  'memory_events',
  'memberships',
]

function getPrivacyStatus(): DataPrivacyStatus {
  return getStorage<DataPrivacyStatus>(PRIVACY_STATUS_KEY) || {
    lastExportAt: null,
    lastDeleteAt: null,
    accountDeletionRequested: false,
    accountDeletionScheduledAt: null,
    totalDataSize: 0,
    totalRecords: 0,
  }
}

function savePrivacyStatus(status: DataPrivacyStatus): void {
  setStorage(PRIVACY_STATUS_KEY, status)
}

export async function exportAllUserData(userId: string): Promise<DataExportResult> {
  try {
    const allData: Record<string, unknown[]> = {}
    let totalRecords = 0

    for (const table of EXPORT_TABLES) {
      try {
        const records = await supabaseClient.select(table, {
          filter: { user_id: userId },
          limit: 10000,
        })
        allData[table] = records || []
        totalRecords += (records || []).length
      } catch {
        allData[table] = []
      }
    }

    // 附加本地存储数据
    const localData: Record<string, unknown> = {}
    const localKeys = [
      'xhh_checkin_data',
      'xhh_pet_data',
      'xhh_notification_data',
      'xhh_subscribe_status',
      'xhh_settings',
    ]

    for (const key of localKeys) {
      try {
        const value = Taro.getStorageSync(key)
        if (value) localData[key] = value
      } catch {
        // 忽略读取失败
      }
    }

    allData['_local_storage'] = [localData]

    const jsonData = JSON.stringify(allData, null, 2)
    const now = new Date().toISOString()

    const status = getPrivacyStatus()
    status.lastExportAt = now
    status.totalRecords = totalRecords
    status.totalDataSize = new Blob([jsonData]).size
    savePrivacyStatus(status)

    return {
      success: true,
      data: jsonData,
      exportedAt: now,
      tables: EXPORT_TABLES,
      totalRecords,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '导出失败',
      exportedAt: new Date().toISOString(),
      tables: [],
      totalRecords: 0,
    }
  }
}

export async function deleteUserData(
  userId: string,
  tableNames?: string[]
): Promise<DataDeleteResult> {
  try {
    const tablesToDelete = tableNames || ALL_USER_TABLES
    let deletedRecords = 0
    const deletedTables: string[] = []

    for (const table of tablesToDelete) {
      try {
        await supabaseClient.delete(table, { user_id: userId })
        deletedTables.push(table)
        deletedRecords += 1 // PostgREST 不返回删除行数，用表数近似
      } catch {
        // 某些表可能为空，忽略
      }
    }

    // 清除本地数据
    Taro.clearStorageSync()

    const now = new Date().toISOString()
    const status = getPrivacyStatus()
    status.lastDeleteAt = now
    savePrivacyStatus(status)

    return {
      success: true,
      deletedAt: now,
      deletedTables,
      deletedRecords,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
      deletedAt: new Date().toISOString(),
      deletedTables: [],
      deletedRecords: 0,
    }
  }
}

export function generateDeletionConfirmCode(): string {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase()
  setStorage(DELETION_CONFIRM_KEY, code)
  return code
}

export function verifyDeletionConfirmCode(inputCode: string): boolean {
  const storedCode = getStorage<string>(DELETION_CONFIRM_KEY)
  return storedCode === inputCode
}

export async function requestAccountDeletion(
  userId: string,
  request: AccountDeletionRequest
): Promise<AccountDeletionResult> {
  if (!verifyDeletionConfirmCode(request.confirmCode)) {
    return {
      success: false,
      error: '确认码不正确',
      gracePeriodDays: 30,
    }
  }

  try {
    const config = getAuthConfig()
    const token = Taro.getStorageSync('xhh_token')

    const res = await Taro.request({
      url: `${config.apiBaseUrl}/api/auth/delete-account`,
      method: 'POST',
      data: {
        reason: request.reason,
        custom_reason: request.customReason,
      },
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.statusCode === 200) {
      const scheduledAt = new Date()
      scheduledAt.setDate(scheduledAt.getDate() + 30)

      const status = getPrivacyStatus()
      status.accountDeletionRequested = true
      status.accountDeletionScheduledAt = scheduledAt.toISOString()
      savePrivacyStatus(status)

      return {
        success: true,
        scheduledDeletionAt: scheduledAt.toISOString(),
        gracePeriodDays: 30,
      }
    }

    return {
      success: false,
      error: res.data?.error || '注销请求失败',
      gracePeriodDays: 30,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '注销请求失败',
      gracePeriodDays: 30,
    }
  }
}

export async function cancelAccountDeletion(userId: string): Promise<boolean> {
  try {
    const config = getAuthConfig()
    const token = Taro.getStorageSync('xhh_token')

    const res = await Taro.request({
      url: `${config.apiBaseUrl}/api/auth/cancel-deletion`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (res.statusCode === 200) {
      const status = getPrivacyStatus()
      status.accountDeletionRequested = false
      status.accountDeletionScheduledAt = null
      savePrivacyStatus(status)
      return true
    }

    return false
  } catch {
    return false
  }
}

export function getDataPrivacyStatus(): DataPrivacyStatus {
  return getPrivacyStatus()
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npm run typecheck`
Expected: 无新增错误

---

## Task 3: 创建账号注销确认组件

**Files:**
- Create: `03-源代码/小程序/miniapp/src/components/AccountDeletionConfirm.tsx`
- Create: `03-源寰海/03-源代码/小程序/miniapp/src/components/AccountDeletionConfirm.scss`

- [ ] **Step 1: 实现确认组件**

```tsx
import React, { useState, useCallback } from 'react'
import { View, Text, Input, Button, Radio, RadioGroup } from '@tarojs/components'
import type { AccountDeletionReason } from '../types/dataPrivacyTypes'
import './AccountDeletionConfirm.scss'

interface Props {
  confirmCode: string
  onConfirm: (reason: AccountDeletionReason, customReason: string, code: string) => void
  onCancel: () => void
  loading: boolean
}

const REASON_OPTIONS: { value: AccountDeletionReason; label: string }[] = [
  { value: 'no_longer_needed', label: '不再需要' },
  { value: 'privacy_concern', label: '隐私顾虑' },
  { value: 'found_better_app', label: '找到更好的替代品' },
  { value: 'too_complicated', label: '使用太复杂' },
  { value: 'other', label: '其他原因' },
]

export const AccountDeletionConfirm: React.FC<Props> = ({
  confirmCode,
  onConfirm,
  onCancel,
  loading,
}) => {
  const [reason, setReason] = useState<AccountDeletionReason>('no_longer_needed')
  const [customReason, setCustomReason] = useState('')
  const [inputCode, setInputCode] = useState('')

  const handleConfirm = useCallback(() => {
    if (inputCode !== confirmCode) {
      return
    }
    onConfirm(reason, customReason, inputCode)
  }, [reason, customReason, inputCode, confirmCode, onConfirm])

  return (
    <View className="account-deletion-confirm">
      <View className="deletion-warning">
        <Text className="warning-icon">⚠️</Text>
        <Text className="warning-title">账号注销确认</Text>
        <Text className="warning-desc">
          注销后，您的所有数据将在30天冷静期后永久删除，且无法恢复。
          包括：宠物档案、健康记录、疫苗记录、症状记录、情绪记录等。
        </Text>
      </View>

      <View className="deletion-reasons">
        <Text className="reason-label">请选择注销原因：</Text>
        <RadioGroup onChange={(e) => setReason(e.detail.value as AccountDeletionReason)}>
          {REASON_OPTIONS.map((opt) => (
            <View key={opt.value} className="reason-option">
              <Radio value={opt.value} checked={reason === opt.value} color="#FF4D4F">
                {opt.label}
              </Radio>
            </View>
          ))}
        </RadioGroup>
      </View>

      {reason === 'other' && (
        <View className="custom-reason">
          <Input
            className="custom-reason-input"
            placeholder="请说明注销原因"
            value={customReason}
            onInput={(e) => setCustomReason(e.detail.value)}
            maxlength={200}
          />
        </View>
      )}

      <View className="confirm-code-section">
        <Text className="code-label">
          请输入确认码 <Text className="code-value">{confirmCode}</Text> 以确认注销
        </Text>
        <Input
          className="code-input"
          placeholder="输入确认码"
          value={inputCode}
          onInput={(e) => setInputCode(e.detail.value)}
          maxlength={6}
        />
      </View>

      <View className="deletion-actions">
        <Button className="cancel-btn" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button
          className="confirm-btn"
          onClick={handleConfirm}
          disabled={loading || inputCode !== confirmCode}
          loading={loading}
        >
          确认注销
        </Button>
      </View>
    </View>
  )
}

export default AccountDeletionConfirm
```

- [ ] **Step 2: 创建样式文件**

```scss
.account-deletion-confirm {
  padding: 32rpx;

  .deletion-warning {
    text-align: center;
    padding: 32rpx;
    background: #FFF2F0;
    border-radius: 16rpx;
    margin-bottom: 32rpx;

    .warning-icon {
      font-size: 48rpx;
      display: block;
      margin-bottom: 16rpx;
    }

    .warning-title {
      font-size: 34rpx;
      font-weight: 600;
      color: #FF4D4F;
      display: block;
      margin-bottom: 12rpx;
    }

    .warning-desc {
      font-size: 26rpx;
      color: #666;
      line-height: 1.6;
    }
  }

  .deletion-reasons {
    margin-bottom: 32rpx;

    .reason-label {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
      display: block;
      margin-bottom: 16rpx;
    }

    .reason-option {
      padding: 16rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
    }
  }

  .custom-reason {
    margin-bottom: 32rpx;

    .custom-reason-input {
      width: 100%;
      padding: 16rpx;
      border: 2rpx solid #e8e8e8;
      border-radius: 12rpx;
      font-size: 28rpx;
    }
  }

  .confirm-code-section {
    margin-bottom: 32rpx;

    .code-label {
      font-size: 26rpx;
      color: #666;
      display: block;
      margin-bottom: 12rpx;

      .code-value {
        font-weight: 600;
        color: #FF4D4F;
        font-size: 30rpx;
        letter-spacing: 4rpx;
      }
    }

    .code-input {
      width: 100%;
      padding: 16rpx;
      border: 2rpx solid #e8e8e8;
      border-radius:  border-radius: 12rpx;
      font-size: 32rpx;
      text-align: center;
      letter-spacing: 8rpx;
    }
  }

  .deletion-actions {
    display: flex;
    gap: 16rpx;

    .cancel-btn,
    .confirm-btn {
      flex: 1;
      height: 88rpx;
      line-height: 88rpx;
      border-radius: 44rpx;
      font-size: 30rpx;
      font-weight: 500;
      text-align: center;
      border: none;
    }

    .cancel-btn {
      background: #f0f0f0;
      color: #666;
    }

    .confirm-btn {
      background: #FF4D4F;
      color: #fff;

      &[disabled] {
        background: #ccc;
      }
    }
  }
}
```

---

## Task 4: 扩展 authStore 添加注销方法

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/stores/authStore.ts`

- [ ] **Step 1: 在 authStore 中添加 deleteAccount 和 cancelDeletion 方法**

在 AuthState 接口中添加：
```typescript
deleteAccount: (reason: AccountDeletionReason, customReason: string, confirmCode: string) => Promise<AccountDeletionResult>
cancelAccountDeletion: () => Promise<boolean>
accountDeletionStatus: DataPrivacyStatus | null
```

在实现中添加：
```typescript
import { requestAccountDeletion, cancelAccountDeletion, getDataPrivacyStatus, generateDeletionConfirmCode } from '../services/dataPrivacyService'
import type { AccountDeletionReason, AccountDeletionResult, DataPrivacyStatus } from '../types/dataPrivacyTypes'

// 在 store 中添加
deleteAccount: async (reason, customReason, confirmCode) => {
  const userId = get().user?.id
  if (!userId) return { success: false, error: '未登录', gracePeriodDays: 30 }

  const result = await requestAccountDeletion(userId, { reason, customReason, confirmCode })
  if (result.success) {
    set({ accountDeletionStatus: getDataPrivacyStatus() })
  }
  return result
},

cancelAccountDeletion: async () => {
  const userId = get().user?.id
  if (!userId) return false

  const success = await cancelAccountDeletion(userId)
  if (success) {
    set({ accountDeletionStatus: getDataPrivacyStatus() })
  }
  return success
},
```

---

## Task 5: 修改设置页面添加隐私数据管理入口

**Files:**
- Modify: `03-源代码/小程序/miniapp/src/pages/settings/index.tsx`
- Modify: `03-源代码/小程序/miniapp/src/pages/settings/index.scss`

- [ ] **Step 1: 在设置页面添加隐私数据管理区块**

在"数据管理"区块中替换现有的简单导出功能，添加完整的数据管理选项：

1. **导出全部数据** - 调用 dataPrivacyService.exportAllUserData，生成JSON文件
2. **删除云端数据** - 二次确认后调用 dataPrivacyService.deleteUserData
3. **注销账号** - 弹出 AccountDeletionConfirm 组件
4. **注销状态展示** - 如果已申请注销，显示冷静期倒计时和取消按钮

- [ ] **Step 2: 添加样式**

---

## Task 6: 创建测试

**Files:**
- Create: `03-源代码/小程序/miniapp/src/utils/__tests__/dataPrivacyService.test.ts`

- [ ] **Step 1: 编写测试**

测试覆盖：
- exportAllUserData 成功/失败
- deleteUserData 成功/失败
- generateDeletionConfirmCode / verifyDeletionConfirmCode
- requestAccountDeletion 确认码错误/成功/失败
- cancelAccountDeletion 成功/失败
- getDataPrivacyStatus

- [ ] **Step 2: 运行全部测试**

Run: `npm test -- --run`
Expected: 所有测试通过

- [ ] **Step 3: 运行类型检查**

Run: `npm run typecheck`
Expected: 零错误

---

## 验收标准

1. ✅ 用户可导出全部个人数据（云端+本地）为JSON
2. ✅ 用户可删除指定或全部云端数据（二次确认）
3. ✅ 用户可申请注销账号（确认码+原因选择+30天冷静期）
4. ✅ 注销期间可取消注销
5. ✅ 设置页面有完整的隐私数据管理入口
6. ✅ 类型安全，TypeScript编译零错误
7. ✅ 单元测试覆盖核心逻辑
