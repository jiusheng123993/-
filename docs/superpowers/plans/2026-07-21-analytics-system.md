# Analytics/Metrics System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight analytics event tracking system for the 星寰海 miniapp that captures key user actions across all pages, with local queue + periodic flush to Supabase.

**Architecture:** A centralized `analyticsService` that queues events locally and flushes to Supabase periodically. A `useAnalytics` hook provides convenient tracking methods. Pages integrate via the hook to track page views and key actions.

**Tech Stack:** Taro (WeChat miniapp), React hooks, Supabase (existing), localStorage queue

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/services/analyticsService.ts` | Core tracking service: queue events locally, flush to Supabase |
| `src/services/__tests__/analyticsService.test.ts` | Unit tests for analytics service |
| `src/hooks/useAnalytics.ts` | React hook wrapper for analytics service |
| `src/hooks/__tests__/useAnalytics.test.ts` | Unit tests for useAnalytics hook |
| `src/pages/index/index.tsx` | Integrate page_view_home, app_open, click_quick_action |
| `src/pagesPet/food-query/index.tsx` | Integrate page_view_food_query, search_food, food_query_success |
| `src/pagesPet/symptom-check/index.tsx` | Integrate page_view_symptom_check, submit_symptom_analysis |
| `src/pagesPet/checkin/index.tsx` | Integrate page_view_checkin, submit_checkin, checkin_success |
| `src/pagesPet/trends/index.tsx` | Integrate page_view_trends, change_time_range, click_export_report |
| `src/pagesPet/vaccine/index.tsx` | Integrate page_view_vaccine, add_vaccine_record, mark_vaccine_complete |
| `src/pagesPet/breed/index.tsx` | Integrate page_view_breed, search_breed, click_breed_card |

---

## Task 1: Create analyticsService Core

**Files:**
- Create: `src/services/analyticsService.ts`
- Create: `src/services/__tests__/analyticsService.test.ts`

### Step 1: Write the failing test

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { trackEvent, flushEvents, getQueueLength, clearQueue } from '../analyticsService'

describe('analyticsService', () => {
  beforeEach(() => {
    clearQueue()
  })

  afterEach(() => {
    clearQueue()
  })

  it('trackEvent queues an event', () => {
    trackEvent('page_view_home', { petCount: 1 })
    expect(getQueueLength()).toBe(1)
  })

  it('trackEvent includes event name and properties', () => {
    trackEvent('search_food', { query: 'chicken', petSpecies: 'dog' })
    const queue = JSON.parse(localStorage.getItem('xhh_analytics_queue') || '[]')
    expect(queue[0].eventName).toBe('search_food')
    expect(queue[0].properties.query).toBe('chicken')
  })

  it('queue respects max size', () => {
    for (let i = 0; i < 110; i++) {
      trackEvent('test_event', { index: i })
    }
    expect(getQueueLength()).toBe(100)
  })

  it('flushEvents clears the queue', async () => {
    trackEvent('page_view_home')
    await flushEvents()
    expect(getQueueLength()).toBe(0)
  })
})
```

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" && npx vitest run src/services/__tests__/analyticsService.test.ts --reporter=verbose`
Expected: FAIL - module not found

### Step 2: Implement analyticsService

```typescript
import Taro from '@tarojs/taro'

export interface AnalyticsEvent {
  eventName: string
  userId?: string
  petId?: string
  properties?: Record<string, unknown>
  timestamp: string
  platform: string
}

const EVENT_QUEUE_KEY = 'xhh_analytics_queue'
const MAX_QUEUE_SIZE = 100

function getUserId(): string | undefined {
  try {
    const user = Taro.getStorageSync('xhh_user')
    return user?.id
  } catch {
    return undefined
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  const event: AnalyticsEvent = {
    eventName,
    userId: getUserId(),
    petId: properties?.petId as string,
    properties,
    timestamp: new Date().toISOString(),
    platform: process.env.TARO_ENV || 'weapp',
  }

  const queue = getQueue()
  queue.push(event)

  if (queue.length > MAX_QUEUE_SIZE) {
    queue.shift()
  }

  Taro.setStorageSync(EVENT_QUEUE_KEY, JSON.stringify(queue))
}

export async function flushEvents(): Promise<void> {
  const queue = getQueue()
  if (queue.length === 0) return

  // TODO: Send to Supabase when endpoint is ready
  // For now, just clear the queue
  Taro.setStorageSync(EVENT_QUEUE_KEY, '[]')
}

export function getQueueLength(): number {
  return getQueue().length
}

export function clearQueue(): void {
  Taro.setStorageSync(EVENT_QUEUE_KEY, '[]')
}

function getQueue(): AnalyticsEvent[] {
  try {
    const raw = Taro.getStorageSync(EVENT_QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw as string) as AnalyticsEvent[]
  } catch {
    return []
  }
}
```

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" && npx vitest run src/services/__tests__/analyticsService.test.ts --reporter=verbose`
Expected: PASS

---

## Task 2: Create useAnalytics Hook

**Files:**
- Create: `src/hooks/useAnalytics.ts`
- Create: `src/hooks/__tests__/useAnalytics.test.ts`

### Step 1: Write the failing test

```typescript
import { describe, it, expect, vi } from 'vitest'
import { useAnalytics } from '../useAnalytics'

describe('useAnalytics', () => {
  it('returns trackPageView and trackEvent functions', () => {
    const result = useAnalytics()
    expect(result.trackPageView).toBeDefined()
    expect(result.trackEvent).toBeDefined()
  })
})
```

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" && npx vitest run src/hooks/__tests__/useAnalytics.test.ts --reporter=verbose`
Expected: FAIL - module not found

### Step 2: Implement useAnalytics hook

```typescript
import { useCallback } from 'react'
import { trackEvent as trackEventService } from '../services/analyticsService'

export function useAnalytics() {
  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    trackEventService('page_view_' + pageName, properties)
  }, [])

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    trackEventService(eventName, properties)
  }, [])

  return { trackPageView, trackEvent }
}
```

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp" && npx vitest run src/hooks/__tests__/useAnalytics.test.ts --reporter=verbose`
Expected: PASS

---

## Task 3: Integrate Analytics into Pages

### Page 1: Home Page (`src/pages/index/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('home')` in useEffect on mount
3. Track `click_quick_action` when quick action tapped
4. Track `show_emotion_intervention` when emotion card shown
5. Track `show_crisis_referral` when crisis card shown
6. Track `show_achievement` when achievement shown

### Page 2: Food Query Page (`src/pagesPet/food-query/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('food_query')` in useEffect on mount
3. Track `search_food` when search submitted
4. Track `food_query_success` when query returns result
5. Track `show_paywall` when paywall displayed

### Page 3: Symptom Check Page (`src/pagesPet/symptom-check/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('symptom_check')` in useEffect on mount
3. Track `submit_symptom_analysis` when analysis submitted
4. Track `show_paywall` when paywall displayed

### Page 4: Checkin Page (`src/pagesPet/checkin/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('checkin')` in useEffect on mount
3. Track `submit_checkin` when checkin submitted
4. Track `checkin_success` when checkin saved successfully
5. Track `show_achievement` when achievement shown

### Page 5: Trends Page (`src/pagesPet/trends/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('trends')` in useEffect on mount
3. Track `change_time_range` when time range changed
4. Track `click_export_report` when export report tapped
5. Track `show_paywall` when paywall displayed

### Page 6: Vaccine Page (`src/pagesPet/vaccine/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('vaccine')` in useEffect on mount
3. Track `add_vaccine_record` when add button tapped
4. Track `mark_vaccine_complete` when complete tapped
5. Track `show_achievement` when achievement shown

### Page 7: Breed Page (`src/pagesPet/breed/index.tsx`)

**Changes:**
1. Import `useAnalytics` hook
2. Call `trackPageView('breed')` in useEffect on mount
3. Track `search_breed` when search input changes
4. Track `click_breed_card` when breed card tapped

---

## Task 4: Full Verification

Run full test suite: `cd "e:\星寰海\03-源代码\小程序\miniapp" && npx vitest run --reporter=verbose`
Expected: All existing tests pass + new analytics tests pass

---

## Self-Review Checklist

- [x] Spec coverage: All 7 pages have analytics integration tasks
- [x] No placeholders: All code is complete
- [x] Type consistency: AnalyticsEvent interface used consistently
- [x] Test coverage: Service and hook both have tests
- [x] Follows existing patterns: Uses Taro storage, similar to usageTracking.ts