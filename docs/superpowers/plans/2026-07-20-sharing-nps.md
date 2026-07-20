# P2 分享裂变与 NPS 问卷 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现健康趋势分享卡片、疫苗完成分享卡片、分享裂变邀请机制、NPS问卷推送，完成PRD P2优先级功能

**Architecture:** 分享卡片采用与FoodShareCard一致的组件模式；裂变机制通过邀请码+分享追踪实现；NPS问卷基于频率控制服务的定时触发机制。所有新功能遵循现有七层架构：types → services → stores → components → pages

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand + Supabase REST API + html2canvas

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/types/shareTypes.ts` | 分享卡片、邀请码、裂变追踪类型定义 |
| `src/types/npsTypes.ts` | NPS问卷类型定义 |
| `src/services/shareService.ts` | 分享追踪、邀请码生成、裂变统计 |
| `src/services/npsService.ts` | NPS问卷推送、提交、频率控制 |
| `src/stores/shareStore.ts` | 分享状态管理 |
| `src/stores/npsStore.ts` | NPS问卷状态管理 |
| `src/components/HealthTrendShareCard.tsx` | 健康趋势分享卡片组件 |
| `src/components/HealthTrendShareCard.scss` | 趋势卡片样式 |
| `src/components/VaccineShareCard.tsx` | 疫苗完成分享卡片组件 |
| `src/components/VaccineShareCard.scss` | 疫苗卡片样式 |
| `src/components/NpsSurvey.tsx` | NPS问卷弹窗组件 |
| `src/components/NpsSurvey.scss` | NPS问卷样式 |
| `src/pages/pet-trends/index.tsx` | 修改：添加趋势分享卡片入口 |
| `src/pages/pet-vaccine/index.tsx` | 修改：添加疫苗分享卡片入口 |
| `src/components/index.ts` | 修改：导出新组件 |
| `src/stores/index.ts` | 修改：导出新Store |
| `src/services/index.ts` | 修改：导出新Service |
| `src/constants/index.ts` | 修改：添加分享/NPS常量 |

---

### Task 1: 类型定义

**Files:**
- Create: `src/types/shareTypes.ts`
- Create: `src/types/npsTypes.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: 创建 shareTypes.ts**

```ts
export type ShareCardType = 'food' | 'health_trend' | 'vaccine';

export interface ShareRecord {
  id: string;
  userId: string;
  cardType: ShareCardType;
  petId: string;
  sharedAt: string;
  platform: string;
  inviteCode: string;
}

export interface InviteCode {
  code: string;
  userId: string;
  createdAt: string;
  useCount: number;
  maxUseCount: number;
}

export interface ReferralRecord {
  id: string;
  inviterId: string;
  inviteeId: string;
  inviteCode: string;
  registeredAt: string;
  rewardGranted: boolean;
}

export interface ShareStats {
  totalShares: number;
  foodShares: number;
  trendShares: number;
  vaccineShares: number;
  totalInvites: number;
  successfulInvites: number;
}

export interface HealthTrendShareData {
  petName: string;
  petAvatar: string;
  dateRange: string;
  trendSummary: string;
  aiInsight: string;
}

export interface VaccineShareData {
  petName: string;
  petAvatar: string;
  vaccineName: string;
  completedDate: string;
  badgeTitle: string;
}
```

- [ ] **Step 2: 创建 npsTypes.ts**

```ts
export type NpsTriggerEvent = 'day_7' | 'day_30' | 'after_share' | 'after_export' | 'manual';

export interface NpsQuestion {
  id: string;
  score: number;
  category: string;
  text: string;
}

export interface NpsSurveyConfig {
  triggerEvent: NpsTriggerEvent;
  minDaysSinceSignup: number;
  cooldownDays: number;
  questions: NpsQuestion[];
}

export interface NpsResponse {
  id: string;
  userId: string;
  score: number;
  triggerEvent: NpsTriggerEvent;
  feedback: string;
  submittedAt: string;
}

export interface NpsStatus {
  lastSurveyAt: string | null;
  lastScore: number | null;
  totalSurveys: number;
  nextSurveyAt: string | null;
  isEligible: boolean;
}
```

- [ ] **Step 3: 修改 constants/index.ts 添加分享/NPS常量**

在现有内容后追加：

```ts
export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_MAX_USE = 50;
export const NPS_MIN_SCORE = 0;
export const NPS_MAX_SCORE = 10;
export const NPS_COOLDOWN_DAYS = 30;
export const NPS_DAY7_TRIGGER = 7;
export const NPS_DAY30_TRIGGER = 30;
export const SHARE_REWARD_INVITES = 3;
```

- [ ] **Step 4: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 2: 分享服务

**Files:**
- Create: `src/services/shareService.ts`
- Create: `src/services/__tests__/shareService.test.ts`

- [ ] **Step 1: 创建 shareService.ts**

```ts
import Taro from '@tarojs/taro';
import { supabaseClient } from './supabaseClient';
import { ENV, STORAGE_KEYS } from '../config/supabase';
import {
  INVITE_CODE_LENGTH,
  INVITE_CODE_MAX_USE,
  SHARE_REWARD_INVITES,
} from '../constants';
import type {
  ShareCardType,
  ShareRecord,
  InviteCode,
  ReferralRecord,
  ShareStats,
} from '../types/shareTypes';

const SHARE_HISTORY_KEY = 'xhh_share_history';
const INVITE_CODE_KEY = 'xhh_invite_code';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getOrCreateInviteCode(userId: string): Promise<string> {
  const cached = Taro.getStorageSync(INVITE_CODE_KEY);
  if (cached) return cached;

  const existing = await supabaseClient.select<InviteCode>(
    'invite_codes',
    { user_id: `eq.${userId}` },
    ENV
  );
  if (existing && existing.length > 0) {
    Taro.setStorageSync(INVITE_CODE_KEY, existing[0].code);
    return existing[0].code;
  }

  const code = generateInviteCode();
  await supabaseClient.insert(
    'invite_codes',
    { code, user_id: userId, use_count: 0, max_use_count: INVITE_CODE_MAX_USE },
    ENV
  );
  Taro.setStorageSync(INVITE_CODE_KEY, code);
  return code;
}

export async function recordShare(
  userId: string,
  cardType: ShareCardType,
  petId: string,
  platform: string
): Promise<ShareRecord | null> {
  const inviteCode = await getOrCreateInviteCode(userId);

  const record = await supabaseClient.insert<ShareRecord>(
    'share_records',
    {
      user_id: userId,
      card_type: cardType,
      pet_id: petId,
      platform,
      invite_code: inviteCode,
    },
    ENV
  );

  const history: ShareRecord[] = Taro.getStorageSync(SHARE_HISTORY_KEY) || [];
  history.push(record);
  Taro.setStorageSync(SHARE_HISTORY_KEY, history);

  return record;
}

export async function getShareStats(userId: string): Promise<ShareStats> {
  const history: ShareRecord[] = Taro.getStorageSync(SHARE_HISTORY_KEY) || [];

  const foodShares = history.filter(r => r.cardType === 'food').length;
  const trendShares = history.filter(r => r.cardType === 'health_trend').length;
  const vaccineShares = history.filter(r => r.cardType === 'vaccine').length;

  const referrals = await supabaseClient.select<ReferralRecord>(
    'referral_records',
    { inviter_id: `eq.${userId}` },
    ENV
  );

  return {
    totalShares: history.length,
    foodShares,
    trendShares,
    vaccineShares,
    totalInvites: referrals?.length || 0,
    successfulInvites: referrals?.filter(r => r.rewardGranted).length || 0,
  };
}

export async function processReferral(
  inviteCode: string,
  newUserId: string
): Promise<boolean> {
  const codeRecord = await supabaseClient.selectOne<InviteCode>(
    'invite_codes',
    { code: `eq.${inviteCode}` },
    ENV
  );

  if (!codeRecord || codeRecord.useCount >= codeRecord.maxUseCount) {
    return false;
  }

  await supabaseClient.insert(
    'referral_records',
    {
      inviter_id: codeRecord.userId,
      invitee_id: newUserId,
      invite_code: inviteCode,
      reward_granted: false,
    },
    ENV
  );

  await supabaseClient.update(
    'invite_codes',
    { use_count: codeRecord.useCount + 1 },
    { code: `eq.${inviteCode}` },
    ENV
  );

  return true;
}

export function getLocalShareHistory(): ShareRecord[] {
  return Taro.getStorageSync(SHARE_HISTORY_KEY) || [];
}

export function clearLocalShareHistory(): void {
  Taro.removeStorageSync(SHARE_HISTORY_KEY);
}
```

- [ ] **Step 2: 创建 shareService.test.ts**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockTaro, mockSupabaseClient, mockEnv } = vi.hoisted(() => ({
  mockTaro: {
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
  },
  mockSupabaseClient: {
    select: vi.fn(),
    selectOne: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockEnv: {
    development: { apiBaseUrl: 'http://localhost:3000', useMock: true },
    production: { apiBaseUrl: 'https://api.example.com', useMock: false },
  },
}));

vi.mock('@tarojs/taro', () => ({ default: mockTaro }));
vi.mock('./supabaseClient', () => ({ supabaseClient: mockSupabaseClient }));
vi.mock('../config/supabase', () => ({
  ENV: mockEnv,
  STORAGE_KEYS: { TOKEN: 'xhh_token', USER: 'xhh_user', REFRESH_TOKEN: 'xhh_refresh_token' },
}));

describe('shareService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMocks();
    mockTaro.getStorageSync.mockReturnValue(null);
  });

  describe('getOrCreateInviteCode', () => {
    it('should return cached code if available', async () => {
      mockTaro.getStorageSync.mockReturnValue('ABC123');
      const { getOrCreateInviteCode } = await import('./shareService');
      const code = await getOrCreateInviteCode('user1');
      expect(code).toBe('ABC123');
    });

    it('should fetch existing code from server if not cached', async () => {
      mockTaro.getStorageSync
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null);
      mockSupabaseClient.select.mockResolvedValue([{ code: 'XYZ789', user_id: 'user1' }]);
      const { getOrCreateInviteCode } = await import('./shareService');
      const code = await getOrCreateInviteCode('user1');
      expect(code).toBe('XYZ789');
    });
  });

  describe('getLocalShareHistory', () => {
    it('should return empty array when no history', async () => {
      mockTaro.getStorageSync.mockReturnValue(null);
      const { getLocalShareHistory } = await import('./shareService');
      const history = getLocalShareHistory();
      expect(history).toEqual([]);
    });

    it('should return stored history', async () => {
      const records = [{ id: '1', cardType: 'food' }];
      mockTaro.getStorageSync.mockReturnValue(records);
      const { getLocalShareHistory } = await import('./shareService');
      const history = getLocalShareHistory();
      expect(history).toEqual(records);
    });
  });

  describe('clearLocalShareHistory', () => {
    it('should remove history from storage', async () => {
      const { clearLocalShareHistory } = await import('./shareService');
      clearLocalShareHistory();
      expect(mockTaro.removeStorageSync).toHaveBeenCalledWith('xhh_share_history');
    });
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/services/__tests__/shareService.test.ts`
Expected: PASS

---

### Task 3: NPS问卷服务

**Files:**
- Create: `src/services/npsService.ts`
- Create: `src/services/__tests__/npsService.test.ts`

- [ ] **Step 1: 创建 npsService.ts**

```ts
import Taro from '@tarojs/taro';
import { supabaseClient } from './supabaseClient';
import { ENV } from '../config/supabase';
import {
  NPS_COOLDOWN_DAYS,
  NPS_DAY7_TRIGGER,
  NPS_DAY30_TRIGGER,
  NPS_MIN_SCORE,
  NPS_MAX_SCORE,
} from '../constants';
import type { NpsTriggerEvent, NpsResponse, NpsStatus } from '../types/npsTypes';

const NPS_STATUS_KEY = 'xhh_nps_status';
const NPS_DISMISSED_KEY = 'xhh_nps_dismissed_at';

export function checkNpsEligibility(userId: string, signupDate: string): NpsStatus {
  const dismissedAt = Taro.getStorageSync(NPS_DISMISSED_KEY);
  const statusData = Taro.getStorageSync(NPS_STATUS_KEY);

  const lastSurveyAt: string | null = statusData?.lastSurveyAt || null;
  const lastScore: number | null = statusData?.lastScore ?? null;
  const totalSurveys: number = statusData?.totalSurveys || 0;

  const now = new Date();
  const signup = new Date(signupDate);
  const daysSinceSignup = Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));

  let isEligible = false;
  let nextSurveyAt: string | null = null;

  if (lastSurveyAt) {
    const lastSurvey = new Date(lastSurveyAt);
    const cooldownEnd = new Date(lastSurvey.getTime() + NPS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    if (now >= cooldownEnd) {
      isEligible = true;
    } else {
      nextSurveyAt = cooldownEnd.toISOString();
    }
  } else if (dismissedAt) {
    const dismissed = new Date(dismissedAt);
    const cooldownEnd = new Date(dismissed.getTime() + NPS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    if (now >= cooldownEnd && daysSinceSignup >= NPS_DAY7_TRIGGER) {
      isEligible = true;
    } else {
      nextSurveyAt = cooldownEnd.toISOString();
    }
  } else if (daysSinceSignup >= NPS_DAY7_TRIGGER) {
    isEligible = true;
  } else {
    const day7Date = new Date(signup.getTime() + NPS_DAY7_TRIGGER * 24 * 60 * 60 * 1000);
    nextSurveyAt = day7Date.toISOString();
  }

  return { lastSurveyAt, lastScore, totalSurveys, nextSurveyAt, isEligible };
}

export function getTriggerEvent(signupDate: string): NpsTriggerEvent {
  const now = new Date();
  const signup = new Date(signupDate);
  const daysSinceSignup = Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceSignup >= NPS_DAY30_TRIGGER) return 'day_30';
  if (daysSinceSignup >= NPS_DAY7_TRIGGER) return 'day_7';
  return 'manual';
}

export async function submitNpsResponse(
  userId: string,
  score: number,
  triggerEvent: NpsTriggerEvent,
  feedback: string
): Promise<NpsResponse | null> {
  if (score < NPS_MIN_SCORE || score > NPS_MAX_SCORE) {
    return null;
  }

  const response = await supabaseClient.insert<NpsResponse>(
    'nps_responses',
    {
      user_id: userId,
      score,
      trigger_event: triggerEvent,
      feedback,
    },
    ENV
  );

  const statusData = Taro.getStorageSync(NPS_STATUS_KEY) || {};
  Taro.setStorageSync(NPS_STATUS_KEY, {
    lastSurveyAt: new Date().toISOString(),
    lastScore: score,
    totalSurveys: (statusData.totalSurveys || 0) + 1,
  });

  Taro.removeStorageSync(NPS_DISMISSED_KEY);

  return response;
}

export function dismissNpsSurvey(): void {
  Taro.setStorageSync(NPS_DISMISSED_KEY, new Date().toISOString());
}

export function getNpsStatus(): NpsStatus {
  const statusData = Taro.getStorageSync(NPS_STATUS_KEY);
  const dismissedAt = Taro.getStorageSync(NPS_DISMISSED_KEY);

  return {
    lastSurveyAt: statusData?.lastSurveyAt || null,
    lastScore: statusData?.lastScore ?? null,
    totalSurveys: statusData?.totalSurveys || 0,
    nextSurveyAt: null,
    isEligible: !dismissedAt,
  };
}
```

- [ ] **Step 2: 创建 npsService.test.ts**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockTaro, mockSupabaseClient, mockEnv } = vi.hoisted(() => ({
  mockTaro: {
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
  },
  mockSupabaseClient: {
    insert: vi.fn(),
  },
  mockEnv: {
    development: { apiBaseUrl: 'http://localhost:3000', useMock: true },
    production: { apiBaseUrl: 'https://api.example.com', useMock: false },
  },
}));

vi.mock('@tarojs/taro', () => ({ default: mockTaro }));
vi.mock('./supabaseClient', () => ({ supabaseClient: mockSupabaseClient }));
vi.mock('../config/supabase', () => ({
  ENV: mockEnv,
  STORAGE_KEYS: { TOKEN: 'xhh_token', USER: 'xhh_user', REFRESH_TOKEN: 'xhh_refresh_token' },
}));

describe('npsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTaro.getStorageSync.mockReturnValue(null);
  });

  describe('checkNpsEligibility', () => {
    it('should be eligible when signup >= 7 days and no prior survey', async () => {
      const signupDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const { checkNpsEligibility } = await import('./npsService');
      const status = checkNpsEligibility('user1', signupDate);
      expect(status.isEligible).toBe(true);
    });

    it('should not be eligible when signup < 7 days', async () => {
      const signupDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { checkNpsEligibility } = await import('./npsService');
      const status = checkNpsEligibility('user1', signupDate);
      expect(status.isEligible).toBe(false);
    });
  });

  describe('submitNpsResponse', () => {
    it('should reject invalid score', async () => {
      const { submitNpsResponse } = await import('./npsService');
      const result = await submitNpsResponse('user1', 15, 'day_7', 'great');
      expect(result).toBeNull();
    });

    it('should submit valid response and update status', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ id: 'nps1', score: 9 });
      const { submitNpsResponse } = await import('./npsService');
      const result = await submitNpsResponse('user1', 9, 'day_7', 'Love it');
      expect(result).toBeTruthy();
      expect(mockTaro.setStorageSync).toHaveBeenCalled();
    });
  });

  describe('dismissNpsSurvey', () => {
    it('should store dismissal timestamp', async () => {
      const { dismissNpsSurvey } = await import('./npsService');
      dismissNpsSurvey();
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith(
        'xhh_nps_dismissed_at',
        expect.any(String)
      );
    });
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/services/__tests__/npsService.test.ts`
Expected: PASS

---

### Task 4: 健康趋势分享卡片组件

**Files:**
- Create: `src/components/HealthTrendShareCard.tsx`
- Create: `src/components/HealthTrendShareCard.scss`

- [ ] **Step 1: 创建 HealthTrendShareCard.tsx**

```tsx
import { View, Text } from '@tarojs/components';
import type { HealthTrendShareData } from '../types/shareTypes';
import './HealthTrendShareCard.scss';

interface HealthTrendShareCardProps extends HealthTrendShareData {
  onShare: () => void;
  onClose: () => void;
}

export default function HealthTrendShareCard({
  petName,
  petAvatar,
  dateRange,
  trendSummary,
  aiInsight,
  onShare,
  onClose,
}: HealthTrendShareCardProps) {
  return (
    <View className='health-trend-share'>
      <View className='health-trend-share__overlay' onClick={onClose} />
      <View className='health-trend-share__card'>
        <View className='health-trend-share__header'>
          <View className='health-trend-share__brand'>星寰海</View>
          <View className='health-trend-share__close' onClick={onClose}>✕</View>
        </View>

        <View className='health-trend-share__pet-info'>
          {petAvatar && (
            <image className='health-trend-share__pet-avatar' src={petAvatar} mode='aspectFill' />
          )}
          <Text className='health-trend-share__pet-name'>{petName}的健康趋势</Text>
        </View>

        <View className='health-trend-share__date'>{dateRange}</View>

        <View className='health-trend-share__summary'>
          <Text className='health-trend-share__summary-label'>趋势概览</Text>
          <Text className='health-trend-share__summary-text'>{trendSummary}</Text>
        </View>

        {aiInsight && (
          <View className='health-trend-share__insight'>
            <Text className='health-trend-share__insight-label'>AI 分析</Text>
            <Text className='health-trend-share__insight-text'>{aiInsight}</Text>
          </View>
        )}

        <View className='health-trend-share__footer'>
          <Text className='health-trend-share__footer-text'>宠物健康管家 · 记录每一天</Text>
        </View>

        <View className='health-trend-share__actions'>
          <View className='health-trend-share__share-btn' onClick={onShare}>
            <Text className='health-trend-share__share-btn-text'>分享给朋友</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 创建 HealthTrendShareCard.scss**

```scss
.health-trend-share {
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  &__card {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 640rpx;
    background: linear-gradient(135deg, #f7f4ed 0%, #fff 100%);
    border-radius: 32rpx;
    padding: 40rpx;
    z-index: 1000;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
  }

  &__brand {
    font-size: 24rpx;
    color: #8C6B4F;
    font-weight: 600;
    letter-spacing: 2rpx;
  }

  &__close {
    font-size: 32rpx;
    color: #999;
    padding: 8rpx;
  }

  &__pet-info {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
  }

  &__pet-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    border: 4rpx solid rgba(140, 107, 79, 0.2);
  }

  &__pet-name {
    font-size: 32rpx;
    font-weight: 600;
    color: #2d2d2d;
  }

  &__date {
    font-size: 24rpx;
    color: #8a8a8a;
    margin-bottom: 24rpx;
  }

  &__summary {
    background: rgba(74, 144, 217, 0.08);
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
  }

  &__summary-label {
    display: block;
    font-size: 22rpx;
    color: #4A90D9;
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  &__summary-text {
    display: block;
    font-size: 26rpx;
    color: #2d2d2d;
    line-height: 1.6;
  }

  &__insight {
    background: rgba(255, 140, 66, 0.08);
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
  }

  &__insight-label {
    display: block;
    font-size: 22rpx;
    color: #FF8C42;
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  &__insight-text {
    display: block;
    font-size: 26rpx;
    color: #2d2d2d;
    line-height: 1.6;
  }

  &__footer {
    text-align: center;
    margin-bottom: 32rpx;
  }

  &__footer-text {
    font-size: 20rpx;
    color: #8C6B4F;
    letter-spacing: 1rpx;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }

  &__share-btn {
    background: linear-gradient(135deg, #FF8C42, #FF6B35);
    border-radius: 48rpx;
    padding: 20rpx 64rpx;
    box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);

    &:active {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }

  &__share-btn-text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }
}
```

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 5: 疫苗完成分享卡片组件

**Files:**
- Create: `src/components/VaccineShareCard.tsx`
- Create: `src/components/VaccineShareCard.scss`

- [ ] **Step 1: 创建 VaccineShareCard.tsx**

```tsx
import { View, Text } from '@tarojs/components';
import type { VaccineShareData } from '../types/shareTypes';
import './VaccineShareCard.scss';

interface VaccineShareCardProps extends VaccineShareData {
  onShare: () => void;
  onClose: () => void;
}

export default function VaccineShareCard({
  petName,
  petAvatar,
  vaccineName,
  completedDate,
  badgeTitle,
  onShare,
  onClose,
}: VaccineShareCardProps) {
  return (
    <View className='vaccine-share'>
      <View className='vaccine-share__overlay' onClick={onClose} />
      <View className='vaccine-share__card'>
        <View className='vaccine-share__header'>
          <View className='vaccine-share__brand'>星寰海</View>
          <View className='vaccine-share__close' onClick={onClose}>✕</View>
        </View>

        <View className='vaccine-share__badge'>
          <Text className='vaccine-share__badge-emoji'>🏆</Text>
          <Text className='vaccine-share__badge-title'>{badgeTitle}</Text>
        </View>

        <View className='vaccine-share__pet-info'>
          {petAvatar && (
            <image className='vaccine-share__pet-avatar' src={petAvatar} mode='aspectFill' />
          )}
          <View className='vaccine-share__pet-detail'>
            <Text className='vaccine-share__pet-name'>{petName}</Text>
            <Text className='vaccine-share__vaccine-name'>{vaccineName}</Text>
          </View>
        </View>

        <View className='vaccine-share__date'>
          <Text className='vaccine-share__date-label'>完成日期</Text>
          <Text className='vaccine-share__date-value'>{completedDate}</Text>
        </View>

        <View className='vaccine-share__footer'>
          <Text className='vaccine-share__footer-text'>负责任的毛孩子家长 · 星寰海</Text>
        </View>

        <View className='vaccine-share__actions'>
          <View className='vaccine-share__share-btn' onClick={onShare}>
            <Text className='vaccine-share__share-btn-text'>炫耀一下</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 创建 VaccineShareCard.scss**

```scss
.vaccine-share {
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  &__card {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 640rpx;
    background: linear-gradient(135deg, #f7f4ed 0%, #fff 100%);
    border-radius: 32rpx;
    padding: 40rpx;
    z-index: 1000;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
  }

  &__brand {
    font-size: 24rpx;
    color: #8C6B4F;
    font-weight: 600;
    letter-spacing: 2rpx;
  }

  &__close {
    font-size: 32rpx;
    color: #999;
    padding: 8rpx;
  }

  &__badge {
    text-align: center;
    margin-bottom: 32rpx;
  }

  &__badge-emoji {
    font-size: 80rpx;
    display: block;
    margin-bottom: 12rpx;
  }

  &__badge-title {
    font-size: 28rpx;
    color: #FF8C42;
    font-weight: 700;
    display: block;
  }

  &__pet-info {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
    padding: 24rpx;
    background: rgba(140, 107, 79, 0.06);
    border-radius: 16rpx;
  }

  &__pet-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    border: 4rpx solid rgba(140, 107, 79, 0.2);
  }

  &__pet-detail {
    flex: 1;
  }

  &__pet-name {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #2d2d2d;
    margin-bottom: 4rpx;
  }

  &__vaccine-name {
    display: block;
    font-size: 24rpx;
    color: #4A90D9;
  }

  &__date {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-top: 1rpx solid rgba(140, 107, 79, 0.1);
    margin-bottom: 24rpx;
  }

  &__date-label {
    font-size: 24rpx;
    color: #8a8a8a;
  }

  &__date-value {
    font-size: 24rpx;
    color: #2d2d2d;
    font-weight: 500;
  }

  &__footer {
    text-align: center;
    margin-bottom: 32rpx;
  }

  &__footer-text {
    font-size: 20rpx;
    color: #8C6B4F;
    letter-spacing: 1rpx;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }

  &__share-btn {
    background: linear-gradient(135deg, #4CAF50, #388E3C);
    border-radius: 48rpx;
    padding: 20rpx 64rpx;
    box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);

    &:active {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }

  &__share-btn-text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }
}
```

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 6: NPS问卷弹窗组件

**Files:**
- Create: `src/components/NpsSurvey.tsx`
- Create: `src/components/NpsSurvey.scss`

- [ ] **Step 1: 创建 NpsSurvey.tsx**

```tsx
import { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import type { NpsTriggerEvent } from '../types/npsTypes';
import './NpsSurvey.scss';

interface NpsSurveyProps {
  triggerEvent: NpsTriggerEvent;
  onSubmit: (score: number, feedback: string) => void;
  onDismiss: () => void;
}

const SCORE_LABELS: Record<string, string> = {
  '0-6': '不太满意',
  '7-8': '还行',
  '9-10': '非常满意',
};

function getScoreLabel(score: number): string {
  if (score <= 6) return SCORE_LABELS['0-6'];
  if (score <= 8) return SCORE_LABELS['7-8'];
  return SCORE_LABELS['9-10'];
}

export default function NpsSurvey({ triggerEvent, onSubmit, onDismiss }: NpsSurveyProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleScoreSelect = useCallback((score: number) => {
    setSelectedScore(score);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedScore === null) return;
    onSubmit(selectedScore, feedback);
    setSubmitted(true);
  }, [selectedScore, feedback, onSubmit]);

  const scores = Array.from({ length: 11 }, (_, i) => i);

  if (submitted) {
    return (
      <View className='nps-survey'>
        <View className='nps-survey__overlay' onClick={onDismiss} />
        <View className='nps-survey__card'>
          <View className='nps-survey__thanks'>
            <Text className='nps-survey__thanks-emoji'>🎉</Text>
            <Text className='nps-survey__thanks-text'>感谢您的反馈！</Text>
            <Text className='nps-survey__thanks-desc'>我们会持续改进，为毛孩子提供更好的服务</Text>
          </View>
          <View className='nps-survey__close-btn' onClick={onDismiss}>
            <Text className='nps-survey__close-btn-text'>关闭</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className='nps-survey'>
      <View className='nps-survey__overlay' onClick={onDismiss} />
      <View className='nps-survey__card'>
        <View className='nps-survey__header'>
          <Text className='nps-survey__title'>您有多愿意推荐星寰海？</Text>
          <Text className='nps-survey__subtitle'>0 = 完全不会 · 10 = 一定会</Text>
        </View>

        <View className='nps-survey__scores'>
          {scores.map(score => (
            <View
              key={score}
              className={`nps-survey__score ${selectedScore === score ? 'nps-survey__score--selected' : ''} ${score <= 6 ? 'nps-survey__score--low' : score <= 8 ? 'nps-survey__score--mid' : 'nps-survey__score--high'}`}
              onClick={() => handleScoreSelect(score)}
            >
              <Text className='nps-survey__score-number'>{score}</Text>
            </View>
          ))}
        </View>

        {selectedScore !== null && (
          <View className='nps-survey__score-label'>
            <Text className='nps-survey__score-label-text'>{getScoreLabel(selectedScore)}</Text>
          </View>
        )}

        {selectedScore !== null && (
          <View className='nps-survey__feedback'>
            <input
              className='nps-survey__feedback-input'
              placeholder={`请告诉我们如何改进（选填）`}
              value={feedback}
              onInput={(e) => setFeedback((e as any).detail.value || '')}
              maxLength={200}
            />
          </View>
        )}

        <View className='nps-survey__actions'>
          <View className='nps-survey__skip' onClick={onDismiss}>
            <Text className='nps-survey__skip-text'>稍后再说</Text>
          </View>
          {selectedScore !== null && (
            <View className='nps-survey__submit' onClick={handleSubmit}>
              <Text className='nps-survey__submit-text'>提交</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 创建 NpsSurvey.scss**

```scss
.nps-survey {
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  &__card {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 640rpx;
    background: #fff;
    border-radius: 32rpx;
    padding: 48rpx 40rpx;
    z-index: 1000;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  }

  &__header {
    text-align: center;
    margin-bottom: 40rpx;
  }

  &__title {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #2d2d2d;
    margin-bottom: 12rpx;
  }

  &__subtitle {
    display: block;
    font-size: 22rpx;
    color: #8a8a8a;
  }

  &__scores {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  &__score {
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid #e0e0e0;
    transition: all 0.2s;

    &--low { border-color: #FF4D4F; }
    &--mid { border-color: #FFC107; }
    &--high { border-color: #4CAF50; }

    &--selected {
      transform: scale(1.15);
      &.nps-survey__score--low { background: #FF4D4F; }
      &.nps-survey__score--mid { background: #FFC107; }
      &.nps-survey__score--high { background: #4CAF50; }
    }
  }

  &__score-number {
    font-size: 22rpx;
    font-weight: 600;
    color: #2d2d2d;
  }

  &__score--selected &__score-number {
    color: #fff;
  }

  &__score-label {
    text-align: center;
    margin-bottom: 24rpx;
  }

  &__score-label-text {
    font-size: 24rpx;
    color: #8C6B4F;
    font-weight: 500;
  }

  &__feedback {
    margin-bottom: 32rpx;
  }

  &__feedback-input {
    width: 100%;
    min-height: 120rpx;
    padding: 20rpx;
    border: 2rpx solid rgba(140, 107, 79, 0.2);
    border-radius: 16rpx;
    font-size: 26rpx;
    color: #2d2d2d;
    background: #f7f4ed;
    box-sizing: border-box;
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__skip {
    padding: 16rpx 32rpx;

    &:active { opacity: 0.7; }
  }

  &__skip-text {
    font-size: 26rpx;
    color: #8a8a8a;
  }

  &__submit {
    background: linear-gradient(135deg, #FF8C42, #FF6B35);
    border-radius: 48rpx;
    padding: 16rpx 48rpx;
    box-shadow: 0 8rpx 24rpx rgba(255, 107, 53, 0.3);

    &:active { opacity: 0.9; }
  }

  &__submit-text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }

  &__thanks {
    text-align: center;
    padding: 40rpx 0;
  }

  &__thanks-emoji {
    font-size: 80rpx;
    display: block;
    margin-bottom: 20rpx;
  }

  &__thanks-text {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #2d2d2d;
    margin-bottom: 12rpx;
  }

  &__thanks-desc {
    display: block;
    font-size: 24rpx;
    color: #8a8a8a;
    line-height: 1.5;
  }

  &__close-btn {
    text-align: center;
    padding: 20rpx;
    border-top: 1rpx solid rgba(0, 0, 0, 0.06);
  }

  &__close-btn-text {
    font-size: 28rpx;
    color: #4A90D9;
    font-weight: 500;
  }
}
```

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 7: 集成到页面

**Files:**
- Modify: `src/pages/pet-trends/index.tsx` - 添加趋势分享卡片入口
- Modify: `src/pages/pet-vaccine/index.tsx` - 添加疫苗分享卡片入口
- Modify: `src/components/index.ts` - 导出新组件
- Modify: `src/stores/index.ts` - 导出新Store（如需要）
- Modify: `src/services/index.ts` - 导出新Service（如需要）

- [ ] **Step 1: 在 pet-trends/index.tsx 添加趋势分享卡片**

在现有 `useShareAppMessage` 附近添加：
- 导入 HealthTrendShareCard 和 shareService
- 添加 showTrendShareCard 状态
- 在导出报告区域旁添加"分享趋势"按钮
- 添加 HealthTrendShareCard 组件渲染
- 在分享回调中调用 recordShare

- [ ] **Step 2: 在 pet-vaccine/index.tsx 添加疫苗分享卡片**

- 导入 VaccineShareCard 和 shareService
- 添加 showVaccineShareCard 状态和 selectedVaccineData
- 在疫苗完成记录旁添加"炫耀"按钮
- 添加 VaccineShareCard 组件渲染
- 在分享回调中调用 recordShare

- [ ] **Step 3: 更新 components/index.ts 导出**

追加：
```ts
export { default as HealthTrendShareCard } from './HealthTrendShareCard'
export { default as VaccineShareCard } from './VaccineShareCard'
export { default as NpsSurvey } from './NpsSurvey'
export { default as AccountDeletionConfirm } from './AccountDeletionConfirm'
export { default as FoodShareCard } from './FoodShareCard'
```

- [ ] **Step 4: 运行类型检查和测试**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS

---

### Task 8: NPS问卷集成到首页

**Files:**
- Modify: `src/pages/index/index.tsx` - 添加NPS问卷弹窗触发逻辑

- [ ] **Step 1: 在首页添加NPS问卷检查**

- 导入 NpsSurvey、npsService
- 在 useEffect 中检查 NPS 资格
- 添加 showNps 状态和 triggerEvent
- 添加 NpsSurvey 组件渲染
- 在提交回调中调用 submitNpsResponse
- 在关闭回调中调用 dismissNpsSurvey

- [ ] **Step 2: 运行完整测试**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 9: 最终验证

- [ ] **Step 1: 运行完整测试套件**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: ZERO ERRORS

- [ ] **Step 3: 更新看板**

Run: `E:\update-board.bat "E:\星寰海" "P2分享裂变NPS完成" "..." "涉及文件列表"`
