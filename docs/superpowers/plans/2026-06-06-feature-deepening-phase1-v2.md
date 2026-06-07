# 星寰海功能深度补全 - 第一阶段落地执行计划 v2

> **For agentic workers:** 按任务顺序逐个执行，每完成一个任务验证后再进入下一个。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** 将 5 个已有代码但未完整接入 App.tsx 的功能模块补全，让产品从"规划阶段"进入"可落地使用"阶段。

**Architecture:** 基于现有 DraggableModal + openWorkbenchDetail 模式，将通知系统、Markdown 日记、全文搜索、跨设备同步、徽章展示完整接入主应用。所有功能通过 localStorage 持久化，保持离线优先。

**Tech Stack:** React 18 + TypeScript + Vite + Vitest + Electron

**当前状态:** 上一轮对话中已创建部分代码文件（notificationService、MarkdownRenderer、SyncUI 等），但未完整接入 App.tsx。本计划基于已有代码进行补全和集成。

---

## 前置清理：回退上一轮未完成的修改

上一轮对话中 AI 直接修改了代码但未完成集成。需要先回退这些修改，然后按本计划重新执行。

- [ ] **Step 1: 回退所有未提交修改**

```bash
git checkout -- src/App.tsx src/canvas/CanvasCard.tsx src/data/DataBackupUI.tsx src/data/dataBackup.ts src/globalsearch/searchService.test.ts src/globalsearch/searchService.ts src/journal/JournalUI.tsx
```

- [ ] **Step 2: 删除上一轮创建但未集成的文件**

```bash
Remove-Item -Recurse -Force src/notifications
Remove-Item -Force src/journal/MarkdownRenderer.tsx, src/journal/MarkdownRenderer.test.tsx, src/journal/journal.css
Remove-Item -Force src/data/SyncUI.tsx, src/data/sync.css
```

- [ ] **Step 3: 确认工作区干净**

```bash
git status
```

预期：只有 `docs/superpowers/plans/2026-06-06-feature-deepening-phase1.md` 是未跟踪文件。

---

## Task 1: 通知提醒系统（完整接入）

**目标:** 创建通知服务 + 通知铃铛组件，接入 App.tsx，实现日程/习惯/复习提醒。

**Files:**
- Create: `src/notifications/notificationService.ts`
- Create: `src/notifications/NotificationBanner.tsx`
- Create: `src/notifications/notification.css`
- Create: `src/notifications/notificationService.test.ts`
- Modify: `src/App.tsx` - 导入并渲染 NotificationBanner，启动定时检查

### 1.1 创建通知服务

- [ ] **Step 1: 创建 `src/notifications/notificationService.ts`**

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
  const defaults: NotificationPreferences = {
    browserEnabled: false,
    scheduleReminders: true,
    habitReminders: true,
    reviewReminders: true,
    goalReminders: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  }
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    return raw ? JSON.parse(raw) : defaults
  } catch { return defaults }
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

- [ ] **Step 2: 创建 `src/notifications/NotificationBanner.tsx`**

```typescript
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

- [ ] **Step 3: 创建 `src/notifications/notification.css`**

```css
.notification-bell {
  position: relative;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.notification-bell:hover {
  background: rgba(255, 255, 255, 0.1);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.notification-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.notification-dropdown {
  position: fixed;
  top: 48px;
  right: 16px;
  width: 360px;
  max-height: 480px;
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notification-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #333);
}

.notification-dropdown-header h3 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
}

.notification-dismiss-all {
  background: none;
  border: none;
  color: var(--accent, #6366f1);
  font-size: 0.8125rem;
  cursor: pointer;
}

.notification-list {
  overflow-y: auto;
  flex: 1;
}

.notification-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--muted, #666);
  font-size: 0.875rem;
}

.notification-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle, #2a2a3a);
  cursor: pointer;
  transition: background 0.15s;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.notification-item.unread {
  background: rgba(99, 102, 241, 0.06);
}

.notification-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 2px;
}

.notification-body {
  font-size: 0.75rem;
  color: var(--muted, #888);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 0.6875rem;
  color: var(--muted, #666);
  margin-top: 4px;
}
```

- [ ] **Step 4: 创建 `src/notifications/notificationService.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createNotificationService } from './notificationService'

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should add a notification', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Hello' })
    expect(n.title).toBe('Test')
    expect(n.read).toBe(false)
    expect(n.dismissed).toBe(false)
  })

  it('should get unread notifications', () => {
    const service = createNotificationService()
    service.add({ type: 'system', title: 'A', body: 'a' })
    service.add({ type: 'system', title: 'B', body: 'b' })
    expect(service.getUnread()).toHaveLength(2)
  })

  it('should mark notification as read', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Hello' })
    service.markRead(n.id)
    expect(service.getUnread()).toHaveLength(0)
  })

  it('should dismiss notification', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Hello' })
    service.dismiss(n.id)
    expect(service.getUnread()).toHaveLength(0)
    expect(service.getActive()).toHaveLength(0)
  })

  it('should dismiss all notifications', () => {
    const service = createNotificationService()
    service.add({ type: 'system', title: 'A', body: 'a' })
    service.add({ type: 'system', title: 'B', body: 'b' })
    service.dismissAll()
    expect(service.getUnread()).toHaveLength(0)
  })

  it('should persist notifications across instances', () => {
    const s1 = createNotificationService()
    s1.add({ type: 'system', title: 'Persist', body: 'test' })
    const s2 = createNotificationService()
    expect(s2.getAll()).toHaveLength(1)
  })

  it('should respect quiet hours for schedule reminders', () => {
    const service = createNotificationService()
    service.updatePrefs({ quietHoursStart: '00:00', quietHoursEnd: '23:59' })
    service.checkScheduleReminders(() => [{ id: '1', title: 'Meeting', time: '10:00' }])
    expect(service.getUnread()).toHaveLength(0)
  })

  it('should deduplicate schedule reminders for same day', () => {
    const service = createNotificationService()
    service.checkScheduleReminders(() => [{ id: '1', title: 'Meeting', time: '10:00' }])
    service.checkScheduleReminders(() => [{ id: '1', title: 'Meeting', time: '10:00' }])
    expect(service.getUnread()).toHaveLength(1)
  })
})
```

- [ ] **Step 5: 运行测试验证**

```bash
npx vitest run src/notifications/notificationService.test.ts
```

预期：8 个测试全部通过。

### 1.2 接入 App.tsx

- [ ] **Step 6: 在 App.tsx 中导入通知模块**

在 `src/App.tsx` 顶部导入区添加：

```typescript
import { createNotificationService } from './notifications/notificationService'
import type { NotificationService } from './notifications/notificationService'
import { NotificationBanner } from './notifications/NotificationBanner'
```

- [ ] **Step 7: 在 App 组件内创建通知服务实例并启动定时检查**

在 App 组件内，`useState` 声明区域之后、`useEffect` 之前添加：

```typescript
const notificationServiceRef = useRef<NotificationService | null>(null)
if (!notificationServiceRef.current) {
  notificationServiceRef.current = createNotificationService()
}
const notificationService = notificationServiceRef.current

useEffect(() => {
  const interval = setInterval(() => {
    notificationService.checkScheduleReminders(() => {
      return workspaceState.schedule?.events
        ?.filter((e: any) => {
          const eventDate = new Date(e.date)
          const today = new Date()
          return eventDate.toDateString() === today.toDateString()
        })
        .map((e: any) => ({ id: e.id, title: e.title, time: e.time || '全天' })) ?? []
    })
    notificationService.checkHabitReminders(() => {
      const today = new Date().toISOString().slice(0, 10)
      return (workspaceState.habits ?? [])
        .filter((h: any) => {
          const todayLog = h.logs?.find((l: any) => l.date === today)
          return !todayLog?.completed
        })
        .map((h: any) => ({ id: h.id, name: h.name }))
    })
    notificationService.checkReviewReminders(() => {
      const today = new Date().toISOString().slice(0, 10)
      return (workspaceState.studyItems ?? [])
        .filter((s: any) => s.nextReview && s.nextReview <= today)
        .map((s: any) => ({ id: s.id, title: s.title }))
    })
  }, 60000)
  return () => clearInterval(interval)
}, [workspaceState, notificationService])
```

- [ ] **Step 8: 在 App.tsx 的 JSX 中渲染 NotificationBanner**

在顶部工具栏区域（SidebarToggle 附近）添加：

```tsx
<NotificationBanner service={notificationService} />
```

- [ ] **Step 9: 运行 lint 和 typecheck**

```bash
npx tsc --noEmit
```

预期：无类型错误。

- [ ] **Step 10: 启动开发服务器验证**

```bash
npx vite
```

打开浏览器，确认：
- 右上角出现 🔔 铃铛图标
- 点击铃铛弹出通知下拉面板
- 面板显示"暂无新通知"

---

## Task 2: 日记 Markdown 支持

**目标:** 为 JournalUI 添加 Markdown 编辑/预览切换功能。

**Files:**
- Create: `src/journal/MarkdownRenderer.tsx`
- Create: `src/journal/journal.css`
- Create: `src/journal/MarkdownRenderer.test.tsx`
- Modify: `src/journal/JournalUI.tsx` - 添加预览模式切换

### 2.1 创建 MarkdownRenderer

- [ ] **Step 1: 创建 `src/journal/MarkdownRenderer.tsx`**

```typescript
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
  const codeBlocks: string[] = []
  let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(`<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`)
    return `\x00CODEBLOCK${idx}\x00`
  })

  html = escapeHtml(html)

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link" data-target="$1">🔗 $1</span>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;" />')

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  const lines = html.split('\n')
  const resultLines: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const liMatch = line.match(/^- (.+)$/)
    if (liMatch) {
      if (!inList) {
        resultLines.push('<ul>')
        inList = true
      }
      resultLines.push(`<li>${liMatch[1]}</li>`)
    } else {
      if (inList) {
        resultLines.push('</ul>')
        inList = false
      }
      resultLines.push(line)
    }
  }
  if (inList) {
    resultLines.push('</ul>')
  }
  html = resultLines.join('\n')

  const paragraphs = html.split(/\n\n+/)
  html = paragraphs.map(p => {
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
      return p
    }
    return `<p>${p.replace(/\n/g, '<br />')}</p>`
  }).join('\n')

  html = html.replace(/\x00CODEBLOCK(\d+)\x00/g, (_match, idx) => {
    return codeBlocks[parseInt(idx)] || ''
  })

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

- [ ] **Step 2: 创建 `src/journal/journal.css`**

```css
.journal-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-subtle, #2a2a3a);
  margin-bottom: 8px;
}

.journal-mode-toggle {
  background: var(--surface-raised, #2a2a3a);
  border: 1px solid var(--border, #333);
  color: var(--text, #e0e0e0);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.15s;
}

.journal-mode-toggle:hover {
  background: var(--surface-hover, #333);
}

.journal-mode-toggle.active {
  background: var(--accent, #6366f1);
  border-color: var(--accent, #6366f1);
  color: white;
}

.journal-textarea {
  width: 100%;
  min-height: 200px;
  background: var(--surface-inset, #1a1a2e);
  border: 1px solid var(--border, #333);
  border-radius: 8px;
  color: var(--text, #e0e0e0);
  padding: 12px;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
}

.journal-textarea:focus {
  outline: none;
  border-color: var(--accent, #6366f1);
}

.markdown-renderer {
  padding: 12px;
  line-height: 1.7;
  color: var(--text, #e0e0e0);
  font-size: 0.875rem;
}

.markdown-renderer h1 { font-size: 1.5rem; margin: 16px 0 8px; }
.markdown-renderer h2 { font-size: 1.25rem; margin: 14px 0 6px; }
.markdown-renderer h3 { font-size: 1.0625rem; margin: 12px 0 4px; }
.markdown-renderer p { margin: 8px 0; }
.markdown-renderer ul, .markdown-renderer ol { padding-left: 20px; margin: 8px 0; }
.markdown-renderer li { margin: 4px 0; }
.markdown-renderer code {
  background: var(--surface-raised, #2a2a3a);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8125rem;
}
.markdown-renderer pre {
  background: var(--surface-raised, #2a2a3a);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}
.markdown-renderer pre code {
  background: none;
  padding: 0;
}
.markdown-renderer blockquote {
  border-left: 3px solid var(--accent, #6366f1);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--muted, #888);
}
.markdown-renderer hr {
  border: none;
  border-top: 1px solid var(--border, #333);
  margin: 16px 0;
}
.markdown-renderer a {
  color: var(--accent, #6366f1);
  text-decoration: none;
}
.markdown-renderer a:hover {
  text-decoration: underline;
}
.markdown-renderer .wiki-link {
  color: var(--accent, #6366f1);
  cursor: pointer;
}
.markdown-renderer img {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}
```

- [ ] **Step 3: 创建 `src/journal/MarkdownRenderer.test.tsx`**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownRenderer } from './MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('should render plain text', () => {
    const { container } = render(<MarkdownRenderer content="Hello World" />)
    expect(container.textContent).toContain('Hello World')
  })

  it('should render bold text', () => {
    const { container } = render(<MarkdownRenderer content="**bold**" />)
    expect(container.innerHTML).toContain('<strong>bold</strong>')
  })

  it('should render headings', () => {
    const { container } = render(<MarkdownRenderer content="# Title" />)
    expect(container.innerHTML).toContain('<h1>Title</h1>')
  })

  it('should render code blocks', () => {
    const { container } = render(<MarkdownRenderer content={"```js\nconst x = 1;\n```"} />)
    expect(container.innerHTML).toContain('<pre>')
    expect(container.innerHTML).toContain('const x = 1;')
  })

  it('should render wiki links', () => {
    const { container } = render(<MarkdownRenderer content="[[页面名]]" />)
    expect(container.innerHTML).toContain('wiki-link')
    expect(container.innerHTML).toContain('页面名')
  })

  it('should render unordered lists', () => {
    const { container } = render(<MarkdownRenderer content="- item 1\n- item 2" />)
    expect(container.innerHTML).toContain('<ul>')
    expect(container.innerHTML).toContain('<li>item 1</li>')
  })

  it('should escape HTML', () => {
    const { container } = render(<MarkdownRenderer content="<script>alert('xss')</script>" />)
    expect(container.innerHTML).not.toContain('<script>')
    expect(container.innerHTML).toContain('&lt;script&gt;')
  })
})
```

- [ ] **Step 4: 运行测试验证**

```bash
npx vitest run src/journal/MarkdownRenderer.test.tsx
```

预期：7 个测试全部通过。

### 2.2 修改 JournalUI 添加预览模式

- [ ] **Step 5: 修改 `src/journal/JournalUI.tsx`**

在文件顶部导入区添加：

```typescript
import { MarkdownRenderer } from './MarkdownRenderer'
import './journal.css'
```

在 JournalUI 组件内部，`isEditing` 状态之后添加：

```typescript
const [previewMode, setPreviewMode] = useState(false)
```

在编辑区域的 textarea 上方添加工具栏：

```tsx
{isEditing && (
  <div className="journal-editor-toolbar">
    <button
      className={`journal-mode-toggle ${!previewMode ? 'active' : ''}`}
      onClick={() => setPreviewMode(false)}
      type="button"
    >
      编辑
    </button>
    <button
      className={`journal-mode-toggle ${previewMode ? 'active' : ''}`}
      onClick={() => setPreviewMode(true)}
      type="button"
    >
      预览
    </button>
  </div>
)}
```

将 textarea 包裹在条件渲染中：

```tsx
{isEditing && !previewMode && (
  <textarea
    className="journal-textarea"
    value={editForm.content}
    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
    placeholder="支持 Markdown 语法：**加粗** *斜体* # 标题 - 列表 [[链接]]"
  />
)}
{isEditing && previewMode && (
  <MarkdownRenderer content={editForm.content || '*暂无内容*'} />
)}
```

- [ ] **Step 6: 运行 typecheck**

```bash
npx tsc --noEmit
```

预期：无类型错误。

- [ ] **Step 7: 启动开发服务器验证**

```bash
npx vite
```

打开浏览器，进入复盘日记弹窗，点击编辑，确认：
- 出现"编辑"/"预览"切换按钮
- 编辑模式下输入 Markdown 文本
- 切换到预览模式能看到渲染后的效果

---

## Task 3: 全局搜索增强（全文搜索）

**目标:** 增强 searchService，支持搜索笔记内容、日记内容、习惯名称等字段。

**Files:**
- Modify: `src/globalsearch/searchService.ts` - 扩展搜索字段
- Modify: `src/globalsearch/searchService.test.ts` - 补充测试用例

### 3.1 增强搜索服务

- [ ] **Step 1: 修改 `src/globalsearch/searchService.ts`**

在文件顶部添加辅助函数：

```typescript
function matchField(value: string | undefined | null, lowerQuery: string): boolean {
  if (!value) return false
  return value.toLowerCase().includes(lowerQuery)
}

function extractMatchSnippet(text: string, query: string, maxLen = 80): string {
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, maxLen)
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, idx + query.length + 30)
  let snippet = text.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  return snippet
}
```

扩展 `SearchResult` 接口，添加 `snippet` 字段：

```typescript
export interface SearchResult {
  id: string
  type: 'task' | 'note' | 'habit' | 'goal' | 'journal' | 'project' | 'study' | 'finance' | 'reading'
  title: string
  description: string
  snippet?: string
  moduleId: string
}
```

在 `search` 方法中扩展搜索逻辑，对每个类型增加内容字段搜索：

```typescript
search(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return []

  const results: SearchResult[] = []

  // 任务搜索 - 扩展搜索描述和标签
  const tasks = getWorkspaceState().tasks ?? []
  tasks.forEach((task: any) => {
    if (matchField(task.title, lowerQuery) || matchField(task.description, lowerQuery) || matchField(task.tags?.join(' '), lowerQuery)) {
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description || '',
        snippet: extractMatchSnippet(task.description || task.title, query),
        moduleId: 'today-tasks'
      })
    }
  })

  // 笔记搜索 - 扩展搜索内容
  const notes = getWorkspaceState().notes ?? []
  notes.forEach((note: any) => {
    if (matchField(note.title, lowerQuery) || matchField(note.content, lowerQuery)) {
      results.push({
        id: note.id,
        type: 'note',
        title: note.title,
        description: note.content?.slice(0, 100) || '',
        snippet: extractMatchSnippet(note.content || note.title, query),
        moduleId: 'notes'
      })
    }
  })

  // 习惯搜索
  const habits = getHabitState?.() ?? []
  habits.forEach((habit: any) => {
    if (matchField(habit.name, lowerQuery) || matchField(habit.description, lowerQuery)) {
      results.push({
        id: habit.id,
        type: 'habit',
        title: habit.name,
        description: habit.description || '',
        snippet: extractMatchSnippet(habit.description || habit.name, query),
        moduleId: 'habit-tracker'
      })
    }
  })

  // 目标搜索
  const goals = getGoalsState?.() ?? []
  goals.forEach((goal: any) => {
    if (matchField(goal.title, lowerQuery) || matchField(goal.description, lowerQuery)) {
      results.push({
        id: goal.id,
        type: 'goal',
        title: goal.title,
        description: goal.description || '',
        snippet: extractMatchSnippet(goal.description || goal.title, query),
        moduleId: 'goal-tracker'
      })
    }
  })

  // 日记搜索 - 搜索内容
  const journals = getJournalState?.() ?? []
  journals.forEach((journal: any) => {
    if (matchField(journal.date, lowerQuery) || matchField(journal.content, lowerQuery) || matchField(journal.mood, lowerQuery)) {
      results.push({
        id: journal.date || journal.id,
        type: 'journal',
        title: `日记 ${journal.date || ''}`,
        description: journal.content?.slice(0, 100) || '',
        snippet: extractMatchSnippet(journal.content || '', query),
        moduleId: 'journal'
      })
    }
  })

  // 项目搜索
  const projects = getProjectState?.() ?? []
  projects.forEach((project: any) => {
    if (matchField(project.name, lowerQuery) || matchField(project.description, lowerQuery)) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.name,
        description: project.description || '',
        snippet: extractMatchSnippet(project.description || project.name, query),
        moduleId: 'project-manager'
      })
    }
  })

  // 学习项搜索
  const studyItems = getStudyState?.() ?? []
  studyItems.forEach((item: any) => {
    if (matchField(item.title, lowerQuery) || matchField(item.content, lowerQuery) || matchField(item.subject, lowerQuery)) {
      results.push({
        id: item.id,
        type: 'study',
        title: item.title,
        description: item.content?.slice(0, 100) || item.subject || '',
        snippet: extractMatchSnippet(item.content || item.title, query),
        moduleId: 'study-dashboard'
      })
    }
  })

  // 财务搜索
  const finances = getFinanceState?.() ?? []
  finances.forEach((item: any) => {
    if (matchField(item.description, lowerQuery) || matchField(item.category, lowerQuery) || matchField(item.note, lowerQuery)) {
      results.push({
        id: item.id,
        type: 'finance',
        title: item.description || item.category || '',
        description: `${item.amount || ''} ${item.type || ''}`,
        snippet: extractMatchSnippet(item.note || item.description || '', query),
        moduleId: 'finance-tracker'
      })
    }
  })

  // 阅读搜索
  const readings = getReadingState?.() ?? []
  readings.forEach((item: any) => {
    if (matchField(item.title, lowerQuery) || matchField(item.author, lowerQuery) || matchField(item.notes, lowerQuery)) {
      results.push({
        id: item.id,
        type: 'reading',
        title: item.title,
        description: item.author || '',
        snippet: extractMatchSnippet(item.notes || item.title, query),
        moduleId: 'reading-list'
      })
    }
  })

  return results
}
```

- [ ] **Step 2: 修改 `src/globalsearch/searchService.test.ts`**

补充全文搜索测试用例：

```typescript
it('should search within note content', () => {
  const getWorkspace = () => ({
    tasks: [],
    notes: [{ id: '1', title: 'Meeting Notes', content: 'Discussed Q3 roadmap and budget allocation' }]
  })
  const service = createSearchService(getWorkspace, () => [], () => [], () => [], () => [], () => [], () => [])
  const results = service.search('budget')
  expect(results).toHaveLength(1)
  expect(results[0].title).toBe('Meeting Notes')
})

it('should search within journal content', () => {
  const getJournal = () => [
    { date: '2026-06-01', content: '今天学习了 React 18 的新特性，包括 Suspense 和 Concurrent Mode', mood: 'productive' }
  ]
  const service = createSearchService(() => ({ tasks: [], notes: [] }), () => [], () => [], () => [], () => [], getJournal, () => [])
  const results = service.search('Suspense')
  expect(results).toHaveLength(1)
  expect(results[0].type).toBe('journal')
})

it('should return snippet with match context', () => {
  const getWorkspace = () => ({
    tasks: [],
    notes: [{ id: '1', title: 'Notes', content: 'This is a very long content that contains the keyword somewhere in the middle of the text' }]
  })
  const service = createSearchService(getWorkspace, () => [], () => [], () => [], () => [], () => [], () => [])
  const results = service.search('keyword')
  expect(results).toHaveLength(1)
  expect(results[0].snippet).toContain('keyword')
})

it('should search habits by name and description', () => {
  const getHabits = () => [
    { id: '1', name: '晨跑', description: '每天早上跑步30分钟' }
  ]
  const service = createSearchService(() => ({ tasks: [], notes: [] }), () => [], getHabits, () => [], () => [], () => [], () => [])
  const results = service.search('跑步')
  expect(results).toHaveLength(1)
})

it('should search goals by description', () => {
  const getGoals = () => [
    { id: '1', title: 'Q3 目标', description: '完成 React 项目重构' }
  ]
  const service = createSearchService(() => ({ tasks: [], notes: [] }), () => [], () => [], () => [], () => [], getGoals, () => [])
  const results = service.search('重构')
  expect(results).toHaveLength(1)
})
```

- [ ] **Step 3: 运行测试验证**

```bash
npx vitest run src/globalsearch/searchService.test.ts
```

预期：所有测试通过（包括原有测试和新测试）。

- [ ] **Step 4: 运行 typecheck**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

## Task 4: 跨设备同步 MVP

**目标:** 在 dataBackup 中添加 SyncManifest 生成和比对功能，在 DataBackupUI 中添加同步入口。

**Files:**
- Modify: `src/data/dataBackup.ts` - 添加 SyncManifest 接口和函数
- Modify: `src/data/DataBackupUI.tsx` - 添加同步入口按钮
- Create: `src/data/SyncUI.tsx` - 同步状态面板
- Create: `src/data/sync.css` - 同步面板样式

### 4.1 添加 SyncManifest

- [ ] **Step 1: 修改 `src/data/dataBackup.ts`**

在文件末尾添加：

```typescript
export interface SyncManifest {
  exportedAt: string
  version: string
  modules: Record<string, { size: number; hash: string }>
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export function generateSyncManifest(): SyncManifest {
  const modules: Record<string, { size: number; hash: string }> = {}
  const keys = [
    'xinghuanhai-workspace',
    'xinghuanhai-study',
    'xinghuanhai-habits',
    'xinghuanhai-finance',
    'xinghuanhai-reading',
    'xinghuanhai-journal',
    'xinghuanhai-goals',
    'xinghuanhai-projects',
    'xinghuanhai-notification-state',
    'xinghuanhai-notification-prefs'
  ]

  for (const key of keys) {
    const raw = localStorage.getItem(key)
    if (raw) {
      modules[key] = {
        size: new Blob([raw]).size,
        hash: simpleHash(raw)
      }
    }
  }

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    modules
  }
}

export function compareManifests(local: SyncManifest, remote: SyncManifest): {
  localOnly: string[]
  remoteOnly: string[]
  changed: string[]
  unchanged: string[]
} {
  const localOnly: string[] = []
  const remoteOnly: string[] = []
  const changed: string[] = []
  const unchanged: string[] = []

  const allKeys = new Set([...Object.keys(local.modules), ...Object.keys(remote.modules)])

  for (const key of allKeys) {
    const localMod = local.modules[key]
    const remoteMod = remote.modules[key]

    if (localMod && !remoteMod) {
      localOnly.push(key)
    } else if (!localMod && remoteMod) {
      remoteOnly.push(key)
    } else if (localMod && remoteMod) {
      if (localMod.hash !== remoteMod.hash) {
        changed.push(key)
      } else {
        unchanged.push(key)
      }
    }
  }

  return { localOnly, remoteOnly, changed, unchanged }
}
```

- [ ] **Step 2: 创建 `src/data/SyncUI.tsx`**

```typescript
import { useState } from 'react'
import { generateSyncManifest, compareManifests, exportAllData, importAllData } from './dataBackup'
import type { SyncManifest } from './dataBackup'
import './sync.css'

interface SyncUIProps {
  onClose: () => void
}

export const SyncUI: React.FC<SyncUIProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'idle' | 'comparing' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [diff, setDiff] = useState<ReturnType<typeof compareManifests> | null>(null)

  const handleExportManifest = () => {
    const manifest = generateSyncManifest()
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sync-manifest-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('清单已导出')
  }

  const handleImportManifest = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        setStatus('comparing')
        const text = await file.text()
        const remoteManifest: SyncManifest = JSON.parse(text)
        const localManifest = generateSyncManifest()
        const result = compareManifests(localManifest, remoteManifest)
        setDiff(result)
        const total = result.localOnly.length + result.remoteOnly.length + result.changed.length
        setMessage(total === 0 ? '数据完全一致，无需同步' : `发现 ${total} 个差异模块`)
        setStatus('done')
      } catch {
        setStatus('error')
        setMessage('清单解析失败，请检查文件格式')
      }
    }
    input.click()
  }

  const handleFullExport = () => {
    exportAllData()
    setMessage('全量数据已导出')
  }

  const handleFullImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        setStatus('syncing')
        const text = await file.text()
        const data = JSON.parse(text)
        importAllData(data)
        setStatus('done')
        setMessage('数据导入成功')
      } catch {
        setStatus('error')
        setMessage('数据导入失败，请检查文件格式')
      }
    }
    input.click()
  }

  return (
    <div className="sync-panel">
      <div className="sync-header">
        <h3>跨设备同步</h3>
        <button className="sync-close" onClick={onClose} type="button">✕</button>
      </div>

      <div className="sync-section">
        <h4>同步清单</h4>
        <p className="sync-desc">导出同步清单到文件，在另一台设备上导入比对差异</p>
        <div className="sync-actions">
          <button className="sync-btn" onClick={handleExportManifest} type="button">
            📤 导出清单
          </button>
          <button className="sync-btn" onClick={handleImportManifest} type="button">
            📥 导入清单比对
          </button>
        </div>
      </div>

      <div className="sync-section">
        <h4>全量数据</h4>
        <p className="sync-desc">导出/导入完整数据（包含所有模块数据）</p>
        <div className="sync-actions">
          <button className="sync-btn" onClick={handleFullExport} type="button">
            📦 导出全部数据
          </button>
          <button className="sync-btn" onClick={handleFullImport} type="button">
            📥 导入全部数据
          </button>
        </div>
      </div>

      {status !== 'idle' && (
        <div className={`sync-status sync-status-${status}`}>
          {status === 'comparing' && '正在比对...'}
          {status === 'syncing' && '正在同步...'}
          {status === 'done' && message}
          {status === 'error' && message}
        </div>
      )}

      {diff && (
        <div className="sync-diff">
          {diff.changed.length > 0 && (
            <div className="sync-diff-group">
              <strong>已变更 ({diff.changed.length})：</strong>
              {diff.changed.map(k => <div key={k} className="sync-diff-item changed">{k}</div>)}
            </div>
          )}
          {diff.localOnly.length > 0 && (
            <div className="sync-diff-group">
              <strong>仅本地 ({diff.localOnly.length})：</strong>
              {diff.localOnly.map(k => <div key={k} className="sync-diff-item local">{k}</div>)}
            </div>
          )}
          {diff.remoteOnly.length > 0 && (
            <div className="sync-diff-group">
              <strong>仅远程 ({diff.remoteOnly.length})：</strong>
              {diff.remoteOnly.map(k => <div key={k} className="sync-diff-item remote">{k}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 创建 `src/data/sync.css`**

```css
.sync-panel {
  padding: 16px;
  color: var(--text, #e0e0e0);
}

.sync-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sync-header h3 {
  margin: 0;
  font-size: 1rem;
}

.sync-close {
  background: none;
  border: none;
  color: var(--muted, #888);
  font-size: 1.125rem;
  cursor: pointer;
}

.sync-section {
  margin-bottom: 20px;
  padding: 12px;
  background: var(--surface-raised, #2a2a3a);
  border-radius: 8px;
}

.sync-section h4 {
  margin: 0 0 4px;
  font-size: 0.875rem;
}

.sync-desc {
  margin: 0 0 12px;
  font-size: 0.75rem;
  color: var(--muted, #888);
}

.sync-actions {
  display: flex;
  gap: 8px;
}

.sync-btn {
  flex: 1;
  padding: 8px 12px;
  background: var(--accent, #6366f1);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.sync-btn:hover {
  opacity: 0.9;
}

.sync-status {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.8125rem;
  margin-top: 12px;
}

.sync-status-done { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.sync-status-error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.sync-status-comparing, .sync-status-syncing { background: rgba(99, 102, 241, 0.1); color: #818cf8; }

.sync-diff {
  margin-top: 12px;
}

.sync-diff-group {
  margin-bottom: 8px;
}

.sync-diff-group strong {
  font-size: 0.8125rem;
}

.sync-diff-item {
  font-size: 0.75rem;
  padding: 2px 8px;
  margin: 2px 0;
  border-radius: 4px;
  font-family: monospace;
}

.sync-diff-item.changed { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
.sync-diff-item.local { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.sync-diff-item.remote { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
```

- [ ] **Step 4: 修改 `src/data/DataBackupUI.tsx`**

在 DataBackupUI 中添加同步入口。在现有导出/导入按钮旁边添加：

```tsx
<button
  className="backup-action-btn"
  onClick={() => props.onSyncOpen?.()}
  type="button"
>
  🔄 跨设备同步
</button>
```

同时更新 DataBackupUI 的 props 接口，添加 `onSyncOpen` 回调。

- [ ] **Step 5: 在 App.tsx 中接入 SyncUI**

在 App.tsx 中：
1. 导入 SyncUI
2. 使用已有的 `isSyncOpen` 状态
3. 在 DraggableModal 中渲染 SyncUI

```tsx
<DraggableModal
  isOpen={isSyncOpen}
  onClose={() => setIsSyncOpen(false)}
  title="跨设备同步"
  subtitle="导出同步清单，在另一台设备上导入比对"
  ariaLabel="跨设备同步"
>
  <SyncUI onClose={() => setIsSyncOpen(false)} />
</DraggableModal>
```

- [ ] **Step 6: 运行 typecheck**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

## Task 5: 成就徽章展示增强

**目标:** BadgeDisplay 已接入 App.tsx 弹窗，但需要增强展示效果和交互。

**Files:**
- Modify: `src/badges/BadgeDisplay.tsx` - 增强 UI 展示
- Create: `src/badges/badges.css` - 徽章样式

### 5.1 增强 BadgeDisplay

- [ ] **Step 1: 查看当前 BadgeDisplay 实现**

```bash
codegraph node BadgeDisplay
```

- [ ] **Step 2: 创建 `src/badges/badges.css`**

```css
.badge-display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px;
}

.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--surface-raised, #2a2a3a);
  border-radius: 12px;
  border: 1px solid var(--border-subtle, #333);
  transition: transform 0.2s, box-shadow 0.2s;
}

.badge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.badge-card.unlocked {
  border-color: var(--accent, #6366f1);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04));
}

.badge-card.locked {
  opacity: 0.5;
  filter: grayscale(0.8);
}

.badge-icon {
  font-size: 2rem;
}

.badge-name {
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: center;
}

.badge-desc {
  font-size: 0.6875rem;
  color: var(--muted, #888);
  text-align: center;
  line-height: 1.3;
}

.badge-progress {
  width: 100%;
  height: 4px;
  background: var(--surface-inset, #1a1a2e);
  border-radius: 2px;
  overflow: hidden;
}

.badge-progress-fill {
  height: 100%;
  background: var(--accent, #6366f1);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.badge-unlock-date {
  font-size: 0.625rem;
  color: var(--muted, #666);
}

.badge-stats {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle, #333);
}

.badge-stat {
  text-align: center;
}

.badge-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent, #6366f1);
}

.badge-stat-label {
  font-size: 0.6875rem;
  color: var(--muted, #888);
}
```

- [ ] **Step 3: 修改 `src/badges/BadgeDisplay.tsx`**

在文件顶部导入 CSS：

```typescript
import './badges.css'
```

增强 BadgeDisplay 组件，添加统计摘要和进度条：

```tsx
export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ progress }) => {
  const badges = getBadges(progress)
  const unlockedCount = badges.filter(b => b.unlocked).length

  return (
    <div className="badge-display-container">
      <div className="badge-stats">
        <div className="badge-stat">
          <div className="badge-stat-value">{unlockedCount}</div>
          <div className="badge-stat-label">已解锁</div>
        </div>
        <div className="badge-stat">
          <div className="badge-stat-value">{badges.length - unlockedCount}</div>
          <div className="badge-stat-label">待解锁</div>
        </div>
        <div className="badge-stat">
          <div className="badge-stat-value">{progress.streakDays}</div>
          <div className="badge-stat-label">连续天数</div>
        </div>
      </div>
      <div className="badge-display-grid">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
            title={badge.description}
          >
            <span className="badge-icon">{badge.icon}</span>
            <span className="badge-name">{badge.name}</span>
            <span className="badge-desc">{badge.description}</span>
            {badge.progress !== undefined && (
              <div className="badge-progress">
                <div
                  className="badge-progress-fill"
                  style={{ width: `${Math.min(100, badge.progress)}%` }}
                />
              </div>
            )}
            {badge.unlockedAt && (
              <span className="badge-unlock-date">
                {new Date(badge.unlockedAt).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 运行 typecheck**

```bash
npx tsc --noEmit
```

预期：无类型错误。

---

## 最终验证

- [ ] **Step 1: 运行全量测试**

```bash
npx vitest run
```

预期：所有测试通过。

- [ ] **Step 2: 运行 lint**

```bash
npx eslint src/
```

预期：无新增错误。

- [ ] **Step 3: 运行 typecheck**

```bash
npx tsc --noEmit
```

预期：无类型错误。

- [ ] **Step 4: 启动开发服务器进行浏览器验证**

```bash
npx vite
```

打开浏览器，逐项验证：
1. ✅ 通知铃铛出现在右上角，点击弹出下拉面板
2. ✅ 日记编辑支持 Markdown 预览切换
3. ✅ 全局搜索能搜索到笔记内容、日记内容
4. ✅ 跨设备同步面板可导出/导入清单
5. ✅ 成就徽章展示统计摘要和进度条

- [ ] **Step 5: 提交代码**

```bash
git add -A
git commit -m "feat: complete Phase 1 feature deepening - notifications, markdown journal, full-text search, cross-device sync MVP, enhanced badge display"
```

---

## 修改文件清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| Create | `src/notifications/notificationService.ts` | 通知服务 |
| Create | `src/notifications/NotificationBanner.tsx` | 通知铃铛组件 |
| Create | `src/notifications/notification.css` | 通知样式 |
| Create | `src/notifications/notificationService.test.ts` | 通知服务测试 |
| Modify | `src/App.tsx` | 接入通知系统 + SyncUI |
| Create | `src/journal/MarkdownRenderer.tsx` | Markdown 渲染器 |
| Create | `src/journal/journal.css` | 日记样式 |
| Create | `src/journal/MarkdownRenderer.test.tsx` | Markdown 渲染器测试 |
| Modify | `src/journal/JournalUI.tsx` | 添加预览模式 |
| Modify | `src/globalsearch/searchService.ts` | 全文搜索增强 |
| Modify | `src/globalsearch/searchService.test.ts` | 搜索测试补充 |
| Modify | `src/data/dataBackup.ts` | SyncManifest 接口和函数 |
| Modify | `src/data/DataBackupUI.tsx` | 同步入口按钮 |
| Create | `src/data/SyncUI.tsx` | 同步状态面板 |
| Create | `src/data/sync.css` | 同步面板样式 |
| Create | `src/badges/badges.css` | 徽章样式 |
| Modify | `src/badges/BadgeDisplay.tsx` | 增强展示 |

**总计：9 个新建文件，8 个修改文件**
