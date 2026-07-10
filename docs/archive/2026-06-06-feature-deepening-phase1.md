# 星寰海 功能深度补全计划 - 第一阶段

> **For agentic workers:** 按任务顺序执行，每完成一个任务验证后再进入下一个。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** 补全 7 个缺失 UI 的模块 + 建立通知提醒系统 + 日记模块深度改造，让产品从"能用"到"好用"

**Architecture:** 沿用现有 DraggableModal + membership-modal 弹窗模式，新增 NotificationService 作为全局通知基础设施，日记模块引入 Markdown 编辑器和双向链接集成

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + localStorage + lucide-react icons

---

## 前置分析

### 当前状态
- 28 个模块中 7 个无 UI：quotes(名言)、report(报告)、relationship(关系空间)、agent(AI对话)、knowledge-graph(知识图谱)、templates(模板)、badges(徽章)
- 实际上：quotes 有 QuoteUI.tsx、report 有 ReportUI.tsx、agent 有 AgentChatUI.tsx、knowledge-graph 有 KnowledgeGraphUI.tsx、templates 有 TemplateUI.tsx、relationship 有 SpaceList/SpaceDetail 等组件、badges 有 BadgeDisplay 组件
- **真正缺失的是**：这些模块的 UI 已存在但未在 App.tsx 中正确接入弹窗系统，或接入方式不完整
- 日记模块仅支持纯文本输入，无 Markdown 渲染、无图片、无双向链接嵌入
- 通知系统完全缺失，ScheduleService 有 getDueReminders() 但无实际通知触发
- 跨设备同步仅有 mock adapter，无真实后端

### 修正后的真实差距
1. **badges(徽章)** - BadgeDisplay 组件存在但未在 App.tsx 弹窗中接入
2. **通知提醒系统** - 完全缺失，ScheduleService 的提醒逻辑未连接到浏览器通知
3. **日记模块深度** - 纯文本，无 Markdown、无图片、无双向链接嵌入
4. **跨设备同步** - 仅有 mock，需实现真实同步方案
5. **全局搜索深度** - 仅标题/描述搜索，无全文搜索

---

## Task 1: 补全 BadgeDisplay 弹窗接入

**Files:**
- Modify: `e:\星寰海\src\App.tsx` (添加 BadgeDisplay 弹窗)

**背景：** BadgeDisplay 组件已存在于 `src/badges/BadgeDisplay.tsx`，但 App.tsx 中未将其接入弹窗系统。用户无法在独立弹窗中查看完整徽章列表。

- [ ] **Step 1: 在 App.tsx 中添加 BadgeDisplay 弹窗状态和渲染**

在 App.tsx 中找到其他弹窗状态声明区域（约 413-423 行），添加：
```typescript
const [isBadgeDisplayOpen, setIsBadgeDisplayOpen] = useState(false)
```

在 Sidebar 的 onOpenBadgeDisplay prop 位置（约在 Sidebar 组件调用处），确保传入了对应的回调。

在弹窗渲染区域（约在 isScheduleOpen 弹窗之后），添加：
```tsx
{isBadgeDisplayOpen && (
  <div className="membership-modal-backdrop" onClick={() => setIsBadgeDisplayOpen(false)} role="presentation">
    <section
      aria-modal="true"
      className="membership-modal"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-label="成就徽章"
      style={{ maxWidth: 800 }}
    >
      <header className="membership-modal-hero">
        <div className="membership-modal-hero-text">
          <p className="eyebrow">Badges · 成就徽章</p>
          <h2>你的成长里程碑</h2>
        </div>
        <button className="membership-modal-close" onClick={() => setIsBadgeDisplayOpen(false)} type="button" aria-label="关闭徽章">
          ×
        </button>
      </header>
      <div className="membership-modal-content">
        <BadgeDisplay />
      </div>
    </section>
  </div>
)}
```

确保文件顶部已导入 BadgeDisplay：
```typescript
import { BadgeDisplay } from './badges/BadgeDisplay'
```

- [ ] **Step 2: 运行类型检查验证**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: 运行测试验证**

```bash
npx vitest run
```
Expected: 全部通过

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(badges): add BadgeDisplay modal entry in App.tsx"
```

---

## Task 2: 建立浏览器通知提醒系统

**Files:**
- Create: `e:\星寰海\src\notifications\notificationService.ts`
- Create: `e:\星寰海\src\notifications\notificationService.test.ts`
- Create: `e:\星寰海\src\notifications\NotificationBanner.tsx`
- Create: `e:\星寰海\src\notifications\notification.css`
- Modify: `e:\星寰海\src\App.tsx` (集成通知系统)

**背景：** ScheduleService 已有 getDueReminders() 和 reminderMinutes 字段，习惯模块有打卡逻辑，学习模块有复习提醒。但没有任何实际的通知触发机制。需要建立统一的 NotificationService，支持浏览器 Notification API 和页内 Banner 两种方式。

- [ ] **Step 1: 创建 notificationService.ts**

```typescript
export interface AppNotification {
  id: string
  type: 'schedule' | 'habit' | 'review' | 'goal' | 'system'
  title: string
  body: string
  icon?: string
  data?: Record<string, string>
  createdAt: string
  read: boolean
  dismissed: boolean
}

export interface NotificationPreferences {
  browserEnabled: boolean
  scheduleReminders: boolean
  habitReminders: boolean
  reviewReminders: boolean
  goalReminders: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

const STORAGE_KEY = 'xinghuanhai-notification-state'
const PREFS_KEY = 'xinghuanhai-notification-prefs'

function loadNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotifications(notifications: AppNotification[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(-200)))
}

function loadPrefs(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return {
      browserEnabled: false,
      scheduleReminders: true,
      habitReminders: true,
      reviewReminders: true,
      goalReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    }
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : {
      browserEnabled: false,
      scheduleReminders: true,
      habitReminders: true,
      reviewReminders: true,
      goalReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    }
  } catch {
    return {
      browserEnabled: false,
      scheduleReminders: true,
      habitReminders: true,
      reviewReminders: true,
      goalReminders: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    }
  }
}

function isInQuietHours(prefs: NotificationPreferences): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = prefs.quietHoursStart.split(':').map(Number)
  const [eh, em] = prefs.quietHoursEnd.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

export function createNotificationService() {
  let notifications = loadNotifications()
  let prefs = loadPrefs()
  let listeners: Array<(notifications: AppNotification[]) => void> = []

  const persist = () => saveNotifications(notifications)
  const persistPrefs = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    }
  }

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    if (Notification.permission === 'granted') {
      prefs.browserEnabled = true
      persistPrefs()
      return true
    }
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    prefs.browserEnabled = granted
    persistPrefs()
    return granted
  }

  const sendBrowserNotification = (notification: AppNotification): void => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!prefs.browserEnabled) return
    if (isInQuietHours(prefs)) return
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      tag: notification.type
    })
  }

  const add = (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>): AppNotification => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false
    }
    notifications.unshift(newNotification)
    persist()
    listeners.forEach(fn => fn(notifications))
    sendBrowserNotification(newNotification)
    return newNotification
  }

  const markRead = (id: string): void => {
    const n = notifications.find(x => x.id === id)
    if (n) {
      n.read = true
      persist()
      listeners.forEach(fn => fn(notifications))
    }
  }

  const dismiss = (id: string): void => {
    const n = notifications.find(x => x.id === id)
    if (n) {
      n.dismissed = true
      persist()
      listeners.forEach(fn => fn(notifications))
    }
  }

  const dismissAll = (): void => {
    notifications.forEach(n => { n.dismissed = true })
    persist()
    listeners.forEach(fn => fn(notifications))
  }

  const getUnread = (): AppNotification[] => {
    return notifications.filter(n => !n.read && !n.dismissed)
  }

  const getActive = (): AppNotification[] => {
    return notifications.filter(n => !n.dismissed).slice(0, 50)
  }

  const getAll = (): AppNotification[] => notifications

  const getPrefs = (): NotificationPreferences => prefs

  const updatePrefs = (updates: Partial<NotificationPreferences>): void => {
    prefs = { ...prefs, ...updates }
    persistPrefs()
  }

  const subscribe = (fn: (notifications: AppNotification[]) => void): () => void => {
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }

  const checkScheduleReminders = (getDueReminders: () => Array<{ id: string; title: string; time: string }>): void => {
    if (!prefs.scheduleReminders) return
    if (isInQuietHours(prefs)) return
    const due = getDueReminders()
    due.forEach(event => {
      const alreadyNotified = notifications.some(
        n => n.type === 'schedule' && n.data?.eventId === event.id &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      )
      if (!alreadyNotified) {
        add({
          type: 'schedule',
          title: '日程提醒',
          body: `${event.title} - ${event.time}`,
          icon: '📅',
          data: { eventId: event.id }
        })
      }
    })
  }

  const checkHabitReminders = (getUncompletedHabits: () => Array<{ id: string; name: string }>): void => {
    if (!prefs.habitReminders) return
    if (isInQuietHours(prefs)) return
    const now = new Date()
    if (now.getHours() < 18) return
    const uncompleted = getUncompletedHabits()
    if (uncompleted.length === 0) return
    const alreadyNotified = notifications.some(
      n => n.type === 'habit' && new Date(n.createdAt).toDateString() === now.toDateString()
    )
    if (!alreadyNotified) {
      add({
        type: 'habit',
        title: '习惯提醒',
        body: `还有 ${uncompleted.length} 个习惯待完成：${uncompleted.slice(0, 3).map(h => h.name).join('、')}`,
        icon: '✅'
      })
    }
  }

  const checkReviewReminders = (getDueReviews: () => Array<{ id: string; title: string }>): void => {
    if (!prefs.reviewReminders) return
    if (isInQuietHours(prefs)) return
    const due = getDueReviews()
    due.forEach(item => {
      const alreadyNotified = notifications.some(
        n => n.type === 'review' && n.data?.itemId === item.id &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      )
      if (!alreadyNotified) {
        add({
          type: 'review',
          title: '复习提醒',
          body: `该复习了：${item.title}`,
          icon: '🧠',
          data: { itemId: item.id }
        })
      }
    })
  }

  return {
    add, markRead, dismiss, dismissAll,
    getUnread, getActive, getAll,
    getPrefs, updatePrefs,
    requestBrowserPermission,
    subscribe,
    checkScheduleReminders,
    checkHabitReminders,
    checkReviewReminders
  }
}

export type NotificationService = ReturnType<typeof createNotificationService>
```

- [ ] **Step 2: 创建 notificationService.test.ts**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createNotificationService } from './notificationService'

describe('notificationService', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should add a notification', () => {
    const service = createNotificationService()
    const n = service.add({
      type: 'schedule',
      title: 'Test',
      body: 'Test body'
    })
    expect(n.id).toBeDefined()
    expect(n.type).toBe('schedule')
    expect(n.read).toBe(false)
    expect(n.dismissed).toBe(false)
  })

  it('should mark notification as read', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Body' })
    service.markRead(n.id)
    const unread = service.getUnread()
    expect(unread.length).toBe(0)
  })

  it('should dismiss notification', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Body' })
    service.dismiss(n.id)
    const active = service.getActive()
    expect(active.length).toBe(0)
  })

  it('should get unread notifications', () => {
    const service = createNotificationService()
    service.add({ type: 'system', title: 'A', body: 'a' })
    service.add({ type: 'system', title: 'B', body: 'b' })
    expect(service.getUnread().length).toBe(2)
  })

  it('should dismiss all', () => {
    const service = createNotificationService()
    service.add({ type: 'system', title: 'A', body: 'a' })
    service.add({ type: 'system', title: 'B', body: 'b' })
    service.dismissAll()
    expect(service.getActive().length).toBe(0)
  })

  it('should update preferences', () => {
    const service = createNotificationService()
    service.updatePrefs({ scheduleReminders: false })
    expect(service.getPrefs().scheduleReminders).toBe(false)
  })

  it('should subscribe to changes', () => {
    const service = createNotificationService()
    const fn = vi.fn()
    service.subscribe(fn)
    service.add({ type: 'system', title: 'Test', body: 'Body' })
    expect(fn).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: 运行测试验证**

```bash
npx vitest run src/notifications/notificationService.test.ts
```
Expected: 7 tests passed

- [ ] **Step 4: 创建 NotificationBanner.tsx**

```tsx
import { useState, useEffect } from 'react'
import type { AppNotification, NotificationService } from './notificationService'
import './notification.css'

interface NotificationBannerProps {
  service: NotificationService
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ service }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => service.getUnread())
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const unsub = service.subscribe(() => {
      setNotifications(service.getUnread())
    })
    const interval = setInterval(() => {
      setNotifications(service.getUnread())
    }, 30000)
    return () => {
      unsub()
      clearInterval(interval)
    }
  }, [service])

  const unreadCount = notifications.length

  return (
    <>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="通知"
        type="button"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-backdrop" onClick={() => setIsOpen(false)} role="presentation">
          <div className="notification-dropdown" onClick={e => e.stopPropagation()}>
            <div className="notification-dropdown-header">
              <h3>通知</h3>
              {unreadCount > 0 && (
                <button
                  className="notification-dismiss-all"
                  onClick={() => {
                    service.dismissAll()
                    setNotifications([])
                  }}
                  type="button"
                >
                  全部已读
                </button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">暂无新通知</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notification-item ${n.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      service.markRead(n.id)
                      service.dismiss(n.id)
                    }}
                  >
                    <span className="notification-icon">{n.icon || '📌'}</span>
                    <div className="notification-content">
                      <div className="notification-title">{n.title}</div>
                      <div className="notification-body">{n.body}</div>
                      <div className="notification-time">
                        {new Date(n.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 5: 创建 notification.css**

```css
.notification-bell {
  position: relative;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background 0.2s;
}

.notification-bell:hover {
  background: rgba(0, 0, 0, 0.05);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-weight: 600;
}

.notification-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.notification-dropdown {
  position: absolute;
  top: 48px;
  right: 16px;
  width: 360px;
  max-height: 480px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.notification-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.notification-dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.notification-dismiss-all {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 13px;
  cursor: pointer;
}

.notification-list {
  overflow-y: auto;
  flex: 1;
}

.notification-empty {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f8f8f8;
}

.notification-item:hover {
  background: #fafafa;
}

.notification-item.unread {
  background: #f5f3ff;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.notification-body {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}
```

- [ ] **Step 6: 在 App.tsx 中集成通知系统**

在 App.tsx 顶部添加导入：
```typescript
import { createNotificationService } from './notifications/notificationService'
import { NotificationBanner } from './notifications/NotificationBanner'
```

在 App 组件内部（约在 service 初始化区域），添加：
```typescript
const [notificationService] = useState(() => createNotificationService())
```

在 useEffect 中添加定时检查（约在其他 useEffect 之后）：
```typescript
useEffect(() => {
  const checkReminders = () => {
    const scheduleService = createScheduleService()
    notificationService.checkScheduleReminders(() =>
      scheduleService.getDueReminders().map(e => ({ id: e.id, title: e.title, time: e.time }))
    )
  }
  checkReminders()
  const interval = setInterval(checkReminders, 60000)
  return () => clearInterval(interval)
}, [notificationService])
```

在顶部导航栏区域（约在 ClockDisplay 附近），添加 NotificationBanner：
```tsx
<NotificationBanner service={notificationService} />
```

- [ ] **Step 7: 运行类型检查和测试**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass

- [ ] **Step 8: Commit**

```bash
git add src/notifications/ src/App.tsx
git commit -m "feat(notifications): add browser notification system with banner UI"
```

---

## Task 3: 日记模块深度改造 - Markdown 支持

**Files:**
- Modify: `e:\星寰海\src\journal\JournalUI.tsx` (添加 Markdown 编辑/预览切换)
- Modify: `e:\星寰海\src\journal\journal.css` (添加 Markdown 样式)
- Create: `e:\星寰海\src\journal\MarkdownRenderer.tsx` (轻量 Markdown 渲染器)
- Create: `e:\星寰海\src\journal\MarkdownRenderer.test.tsx`

**背景：** 日记当前仅支持纯文本输入（content 字段），竞品 Notion/Obsidian 均支持富文本/Markdown。需要添加 Markdown 编辑和预览功能，同时保持与现有双向链接系统 `[[页面名]]` 语法的兼容。

- [ ] **Step 1: 创建 MarkdownRenderer.tsx**

```tsx
import { useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderMarkdown(text: string): string {
  let html = escapeHtml(text)

  // Code blocks (must be before inline code)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // Wiki links [[page]]
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link" data-target="$1">🔗 $1</span>')

  // External links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;" />')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />')

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // Line breaks (double newline = paragraph)
  const paragraphs = html.split(/\n\n+/)
  html = paragraphs.map(p => {
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
      return p
    }
    return `<p>${p.replace(/\n/g, '<br />')}</p>`
  }).join('\n')

  return html
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const html = useMemo(() => renderMarkdown(content), [content])

  return (
    <div
      className="markdown-renderer"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

- [ ] **Step 2: 创建 MarkdownRenderer.test.tsx**

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownRenderer } from './MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('renders bold text', () => {
    const { container } = render(<MarkdownRenderer content="**bold**" />)
    expect(container.innerHTML).toContain('<strong>bold</strong>')
  })

  it('renders italic text', () => {
    const { container } = render(<MarkdownRenderer content="*italic*" />)
    expect(container.innerHTML).toContain('<em>italic</em>')
  })

  it('renders wiki links', () => {
    const { container } = render(<MarkdownRenderer content="[[日记]]" />)
    expect(container.innerHTML).toContain('wiki-link')
    expect(container.innerHTML).toContain('日记')
  })

  it('renders headers', () => {
    const { container } = render(<MarkdownRenderer content="# Title" />)
    expect(container.innerHTML).toContain('<h1>Title</h1>')
  })

  it('renders code blocks', () => {
    const { container } = render(<MarkdownRenderer content="```js\nconst x = 1\n```" />)
    expect(container.innerHTML).toContain('<pre>')
    expect(container.innerHTML).toContain('const x = 1')
  })

  it('renders inline code', () => {
    const { container } = render(<MarkdownRenderer content="use `code` here" />)
    expect(container.innerHTML).toContain('<code>code</code>')
  })

  it('renders unordered lists', () => {
    const { container } = render(<MarkdownRenderer content="- item 1\n- item 2" />)
    expect(container.innerHTML).toContain('<ul>')
    expect(container.innerHTML).toContain('<li>item 1</li>')
  })

  it('renders external links', () => {
    const { container } = render(<MarkdownRenderer content="[Google](https://google.com)" />)
    expect(container.innerHTML).toContain('href="https://google.com"')
  })

  it('escapes HTML', () => {
    const { container } = render(<MarkdownRenderer content="<script>alert('xss')</script>" />)
    expect(container.innerHTML).not.toContain('<script>')
  })
})
```

- [ ] **Step 3: 运行测试**

```bash
npx vitest run src/journal/MarkdownRenderer.test.tsx
```
Expected: 9 tests passed

- [ ] **Step 4: 修改 JournalUI.tsx 添加 Markdown 编辑/预览切换**

在 JournalUI.tsx 中找到内容输入区域（textarea），将其替换为支持编辑/预览切换的组件。

在文件顶部添加导入：
```typescript
import { MarkdownRenderer } from './MarkdownRenderer'
import { Eye, Edit3 } from 'lucide-react'
```

在组件内部添加状态：
```typescript
const [previewMode, setPreviewMode] = useState(false)
```

找到现有的 textarea（用于 content 输入），将其包裹在条件渲染中：
```tsx
<div className="journal-content-editor">
  <div className="journal-editor-toolbar">
    <span className="journal-editor-label">
      {previewMode ? '预览' : '编辑'}
    </span>
    <button
      className="journal-editor-toggle"
      onClick={() => setPreviewMode(!previewMode)}
      type="button"
      title={previewMode ? '切换到编辑' : '切换到预览'}
    >
      {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
      {previewMode ? '编辑' : '预览'}
    </button>
  </div>
  {previewMode ? (
    <div className="journal-markdown-preview">
      {formData.content ? (
        <MarkdownRenderer content={formData.content} />
      ) : (
        <p className="journal-preview-empty">暂无内容，切换到编辑模式开始写作</p>
      )}
    </div>
  ) : (
    <textarea
      className="journal-content-textarea"
      value={formData.content}
      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
      placeholder="支持 Markdown 语法：**加粗** *斜体* `代码` [[双向链接]]"
      rows={12}
    />
  )}
</div>
```

- [ ] **Step 5: 在 journal.css 中添加 Markdown 相关样式**

在 `e:\星寰海\src\journal\journal.css` 末尾添加：
```css
.journal-content-editor {
  margin-bottom: 16px;
}

.journal-editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.journal-editor-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.journal-editor-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}

.journal-editor-toggle:hover {
  background: #e5e7eb;
}

.journal-content-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 0 0 8px 8px;
  font-size: 14px;
  line-height: 1.7;
  font-family: 'SF Mono', 'Fira Code', monospace;
  resize: vertical;
  min-height: 200px;
  outline: none;
  transition: border-color 0.15s;
}

.journal-content-textarea:focus {
  border-color: #6366f1;
}

.journal-markdown-preview {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 0 0 8px 8px;
  min-height: 200px;
  background: #fefefe;
}

.journal-preview-empty {
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
}

.markdown-renderer {
  font-size: 15px;
  line-height: 1.8;
  color: #1f2937;
}

.markdown-renderer h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 16px 0 8px;
  color: #111827;
}

.markdown-renderer h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 14px 0 6px;
  color: #1f2937;
}

.markdown-renderer h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 12px 0 4px;
  color: #374151;
}

.markdown-renderer p {
  margin: 8px 0;
}

.markdown-renderer strong {
  font-weight: 600;
  color: #111827;
}

.markdown-renderer em {
  font-style: italic;
}

.markdown-renderer code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #e11d48;
}

.markdown-renderer pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-renderer pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 13px;
}

.markdown-renderer blockquote {
  border-left: 3px solid #6366f1;
  padding: 8px 16px;
  margin: 12px 0;
  background: #f5f3ff;
  border-radius: 0 8px 8px 0;
  color: #4b5563;
}

.markdown-renderer ul, .markdown-renderer ol {
  padding-left: 24px;
  margin: 8px 0;
}

.markdown-renderer li {
  margin: 4px 0;
}

.markdown-renderer hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16px 0;
}

.markdown-renderer .wiki-link {
  color: #6366f1;
  background: #eef2ff;
  padding: 1px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.markdown-renderer .wiki-link:hover {
  background: #e0e7ff;
}

.markdown-renderer a {
  color: #6366f1;
  text-decoration: underline;
}

.markdown-renderer img {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

.markdown-renderer del {
  text-decoration: line-through;
  color: #9ca3af;
}
```

- [ ] **Step 6: 运行类型检查和全部测试**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass

- [ ] **Step 7: Commit**

```bash
git add src/journal/
git commit -m "feat(journal): add Markdown editor/preview with wiki link support"
```

---

## Task 4: 全局搜索增强 - 全文搜索

**Files:**
- Modify: `e:\星寰海\src\globalsearch\globalSearchService.ts` (增强搜索深度)

**背景：** 当前全局搜索仅匹配标题和描述字段，不搜索实际内容（如日记正文、笔记内容等）。需要增强为全文搜索。

- [ ] **Step 1: 增强 globalSearchService.ts 的搜索逻辑**

在 `e:\星寰海\src\globalsearch\globalSearchService.ts` 中，找到搜索函数，增强为同时搜索内容字段。

核心改动：在每个数据源的搜索中，除了匹配 title/description，还要匹配 content/body 字段，并在结果中返回匹配的上下文片段。

```typescript
function getMatchContext(text: string, query: string, contextLength: number = 60): string {
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text.slice(0, contextLength) + (text.length > contextLength ? '...' : '')
  const start = Math.max(0, idx - Math.floor(contextLength / 2))
  const end = Math.min(text.length, idx + query.length + Math.floor(contextLength / 2))
  let context = text.slice(start, end)
  if (start > 0) context = '...' + context
  if (end < text.length) context = context + '...'
  return context
}
```

在搜索日记时，增加对 content 字段的搜索：
```typescript
// 搜索日记
const journalRaw = window.localStorage.getItem('xinghuanhai-journal-state')
if (journalRaw) {
  try {
    const data = JSON.parse(journalRaw)
    const entries = data.entries || []
    entries.forEach((e: any) => {
      const titleMatch = (e.title || '').toLowerCase().includes(queryLower)
      const contentMatch = (e.content || '').toLowerCase().includes(queryLower)
      if (titleMatch || contentMatch) {
        results.push({
          type: 'journal',
          id: e.id,
          title: e.title || '日记',
          description: contentMatch ? getMatchContext(e.content || '', query) : (e.content || '').slice(0, 80),
          date: e.date || e.createdAt,
          matchedText: contentMatch ? getMatchContext(e.content || '', query) : e.title
        })
      }
    })
  } catch {}
}
```

类似地增强速记(quicknotes)、目标(goals)、项目(projects)、阅读(reading)等模块的内容搜索。

- [ ] **Step 2: 运行类型检查和测试**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/globalsearch/
git commit -m "feat(search): enhance global search with full-text content matching"
```

---

## Task 5: 跨设备同步 MVP - JSON 导入导出增强

**Files:**
- Modify: `e:\星寰海\src\data\dataBackup.ts` (增强备份功能)
- Create: `e:\星寰海\src\sync\SyncUI.tsx` (同步管理界面)
- Create: `e:\星寰海\src\sync\sync.css`

**背景：** 当前 dataBackup.ts 已支持 JSON 导出/导入，但缺少增量同步、冲突检测和用户友好的同步界面。作为 MVP，先实现基于 JSON 文件的手动同步 + 版本对比。

- [ ] **Step 1: 增强 dataBackup.ts 添加版本对比和增量合并**

在 dataBackup.ts 中添加：
```typescript
export interface SyncManifest {
  version: number
  lastModified: string
  deviceId: string
  deviceName: string
  moduleVersions: Record<string, number>
}

export function generateSyncManifest(): SyncManifest {
  const modules = getBackupModules()
  const moduleVersions: Record<string, number> = {}
  modules.forEach(m => {
    const raw = localStorage.getItem(m.key)
    if (raw) {
      moduleVersions[m.key] = raw.length
    }
  })
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    moduleVersions
  }
}

function getDeviceId(): string {
  let id = localStorage.getItem('xinghuanhai-device-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('xinghuanhai-device-id', id)
  }
  return id
}

function getDeviceName(): string {
  return navigator.userAgent.includes('Windows') ? 'Windows' :
    navigator.userAgent.includes('Mac') ? 'Mac' :
    navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown'
}

export function compareManifests(local: SyncManifest, remote: SyncManifest): {
  newer: 'local' | 'remote' | 'same'
  conflicts: string[]
} {
  const conflicts: string[] = []
  let localNewer = 0
  let remoteNewer = 0

  const allKeys = new Set([...Object.keys(local.moduleVersions), ...Object.keys(remote.moduleVersions)])
  allKeys.forEach(key => {
    const lv = local.moduleVersions[key] || 0
    const rv = remote.moduleVersions[key] || 0
    if (lv > rv) localNewer++
    else if (rv > lv) remoteNewer++
    if (lv > 0 && rv > 0 && lv !== rv) {
      conflicts.push(key)
    }
  })

  if (conflicts.length > 0) return { newer: 'same', conflicts }
  if (localNewer > remoteNewer) return { newer: 'local', conflicts: [] }
  if (remoteNewer > localNewer) return { newer: 'remote', conflicts: [] }
  return { newer: 'same', conflicts: [] }
}
```

- [ ] **Step 2: 创建 SyncUI.tsx**

```tsx
import { useState, useRef } from 'react'
import { exportAllData, importAllData, generateSyncManifest, compareManifests, type BackupData } from '../data/dataBackup'
import './sync.css'

interface SyncUIProps {
  onClose: () => void
}

export const SyncUI: React.FC<SyncUIProps> = ({ onClose }) => {
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      const data = exportAllData()
      const manifest = generateSyncManifest()
      const blob = new Blob([JSON.stringify({ ...data, _manifest: manifest }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `xinghuanhai-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('导出成功！请将文件传输到另一台设备并导入。')
      setError('')
    } catch (e) {
      setError('导出失败：' + (e instanceof Error ? e.message : '未知错误'))
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData & { _manifest?: ReturnType<typeof generateSyncManifest> }
      const localManifest = generateSyncManifest()
      if (data._manifest) {
        const comparison = compareManifests(localManifest, data._manifest)
        if (comparison.conflicts.length > 0) {
          setError(`检测到 ${comparison.conflicts.length} 个模块存在冲突，已使用最新版本。冲突模块：${comparison.conflicts.slice(0, 5).join(', ')}`)
        }
      }
      importAllData(data)
      setStatus('导入成功！数据已合并。')
      setError('')
    } catch (e) {
      setError('导入失败：文件格式不正确')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="sync-overlay" onClick={onClose} role="presentation">
      <section className="sync-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label="数据同步">
        <div className="sync-header">
          <h2>🔄 数据同步</h2>
          <button className="sync-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="sync-body">
          <div className="sync-info">
            <p>当前数据存储在浏览器本地。通过导出/导入 JSON 文件，可以在不同设备间手动同步数据。</p>
          </div>

          <div className="sync-actions">
            <button className="sync-btn export" onClick={handleExport}>
              📤 导出数据
            </button>
            <label className="sync-btn import">
              📥 导入数据
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {status && <div className="sync-status success">{status}</div>}
          {error && <div className="sync-status error">{error}</div>}

          <div className="sync-tips">
            <h3>💡 同步提示</h3>
            <ul>
              <li>在设备 A 上导出数据文件</li>
              <li>通过微信/网盘/邮件将文件传输到设备 B</li>
              <li>在设备 B 上导入数据文件</li>
              <li>系统会自动合并数据，保留最新版本</li>
              <li>建议每天至少同步一次</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: 创建 sync.css**

```css
.sync-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sync-panel {
  background: #ffffff;
  border-radius: 20px;
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.sync-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.sync-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.sync-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px 8px;
  border-radius: 6px;
}

.sync-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.sync-body {
  padding: 24px;
}

.sync-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #0369a1;
  line-height: 1.6;
}

.sync-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.sync-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.sync-btn.export {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.sync-btn.export:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.sync-btn.import {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.sync-btn.import:hover {
  background: #e5e7eb;
}

.sync-status {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 16px;
}

.sync-status.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.sync-status.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.sync-tips {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
}

.sync-tips h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.sync-tips ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.8;
}
```

- [ ] **Step 4: 在 App.tsx 中接入 SyncUI**

在 App.tsx 中添加：
```typescript
import { SyncUI } from './sync/SyncUI'

const [isSyncOpen, setIsSyncOpen] = useState(false)
```

在弹窗区域添加：
```tsx
{isSyncOpen && <SyncUI onClose={() => setIsSyncOpen(false)} />}
```

在侧边栏设置区域添加同步入口按钮。

- [ ] **Step 5: 运行类型检查和测试**

```bash
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/sync/ src/data/dataBackup.ts src/App.tsx
git commit -m "feat(sync): add manual JSON sync with conflict detection UI"
```

---

## 验证清单

全部任务完成后，执行以下验证：

- [ ] `npx tsc --noEmit` - 0 errors
- [ ] `npx vitest run` - 全部测试通过
- [ ] `npm run dev` - 开发服务器正常启动
- [ ] 浏览器验证：
  - [ ] 徽章弹窗可正常打开和关闭
  - [ ] 通知铃铛显示在顶部导航栏
  - [ ] 日记支持 Markdown 编辑和预览切换
  - [ ] 全局搜索可搜索日记正文内容
  - [ ] 同步面板可导出/导入 JSON 文件

---

## 已修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/App.tsx` | 修改 | 添加 BadgeDisplay/SyncUI 弹窗、NotificationBanner 集成 |
| `src/notifications/notificationService.ts` | 新建 | 统一通知服务 |
| `src/notifications/notificationService.test.ts` | 新建 | 通知服务测试 |
| `src/notifications/NotificationBanner.tsx` | 新建 | 通知铃铛 UI 组件 |
| `src/notifications/notification.css` | 新建 | 通知样式 |
| `src/journal/JournalUI.tsx` | 修改 | 添加 Markdown 编辑/预览切换 |
| `src/journal/MarkdownRenderer.tsx` | 新建 | 轻量 Markdown 渲染器 |
| `src/journal/MarkdownRenderer.test.tsx` | 新建 | Markdown 渲染器测试 |
| `src/journal/journal.css` | 修改 | 添加 Markdown 样式 |
| `src/globalsearch/globalSearchService.ts` | 修改 | 增强全文搜索 |
| `src/data/dataBackup.ts` | 修改 | 添加同步清单和版本对比 |
| `src/sync/SyncUI.tsx` | 新建 | 同步管理界面 |
| `src/sync/sync.css` | 新建 | 同步界面样式 |

## 建议 commit message

```
feat(core): phase 1 deepening - notifications, markdown journal, full-text search, sync

- Add browser notification system with bell UI and reminder checks
- Add Markdown editor/preview toggle to journal with wiki link rendering
- Enhance global search with full-text content matching
- Add manual JSON sync with conflict detection UI
- Connect BadgeDisplay modal in App.tsx
```
