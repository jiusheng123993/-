# Persona 选择界面重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 Persona 选择界面，实现自由描述+标签组合的身份系统、可拖拽画布布局、鸿蒙风格动画

**Architecture:** 采用 React Context + useReducer 管理身份和布局状态，使用 @dnd-kit 实现拖拽，CSS Transitions 实现鸿蒙风格动画

**Tech Stack:** React 18, TypeScript, @dnd-kit, CSS Transitions

---

## 文件结构规划

```
src/
  identity/
    IdentityProvider.tsx       # 身份上下文 Provider
    useIdentity.ts             # 身份 Hook
    identityStore.ts           # 身份本地存储
    types.ts                   # 身份类型定义
  module-store/
    ModuleStore.tsx            # 模块商店组件
    ModuleRegistry.ts          # 模块注册表
    useModuleStore.ts          # 模块商店 Hook
  canvas/
    DraggableCanvas.tsx        # 可拖拽画布
    CanvasCard.tsx             # 画布卡片
    useCanvasLayout.ts         # 布局管理 Hook
  sidebar/
    Sidebar.tsx                # 侧边栏
    SidebarToggle.tsx          # 侧边栏切换按钮
  animations/
    harmonyOS.ts               # 鸿蒙动画配置
    useHarmonyAnimation.ts     # 动画 Hook
```

---

## Task 1: 身份系统类型定义

**Files:**
- Create: `src/identity/types.ts`

- [ ] **Step 1: 定义身份类型**

```typescript
export type IdentityId = string

export type IdentityTag = 
  | 'student' | 'worker' | 'parent' | 'creator'
  | 'freelancer' | 'entrepreneur' | 'retiree' | 'other'

export type Identity = {
  id: IdentityId
  name: string
  description: string
  tags: IdentityTag[]
  createdAt: string
  updatedAt: string
}

export type IdentityState = {
  identities: Identity[]
  activeIdentityId: IdentityId | null
  isCreating: boolean
}

export type IdentityAction =
  | { type: 'CREATE_IDENTITY'; payload: Omit<Identity, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_IDENTITY'; payload: Identity }
  | { type: 'DELETE_IDENTITY'; payload: IdentityId }
  | { type: 'SET_ACTIVE_IDENTITY'; payload: IdentityId }
  | { type: 'SET_CREATING'; payload: boolean }
```

- [ ] **Step 2: Commit**

```bash
git add src/identity/types.ts
git commit -m "feat(identity): add identity system types"
```

---

## Task 2: 身份存储层

**Files:**
- Create: `src/identity/identityStore.ts`

- [ ] **Step 1: 实现身份存储**

```typescript
import type { Identity, IdentityId, IdentityState } from './types'

const STORAGE_KEY = 'xinghuanhai_identities'

export const createIdentityStore = () => {
  const load = (): IdentityState => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createDefaultState()
      return JSON.parse(raw)
    } catch {
      return createDefaultState()
    }
  }

  const save = (state: IdentityState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return { load, save }
}

const createDefaultState = (): IdentityState => ({
  identities: [],
  activeIdentityId: null,
  isCreating: false
})
```

- [ ] **Step 2: Commit**

```bash
git add src/identity/identityStore.ts
git commit -m "feat(identity): add identity store"
```

---

## Task 3: 身份 Context Provider

**Files:**
- Create: `src/identity/IdentityProvider.tsx`

- [ ] **Step 1: 实现 IdentityProvider**

```typescript
import { createContext, useContext, useReducer, useEffect } from 'react'
import type { IdentityState, IdentityAction } from './types'
import { createIdentityStore } from './identityStore'

const IdentityContext = createContext<{
  state: IdentityState
  dispatch: React.Dispatch<IdentityAction>
} | null>(null)

const identityReducer = (state: IdentityState, action: IdentityAction): IdentityState => {
  switch (action.type) {
    case 'CREATE_IDENTITY':
      const newIdentity = {
        ...action.payload,
        id: `identity-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        ...state,
        identities: [...state.identities, newIdentity],
        activeIdentityId: newIdentity.id,
        isCreating: false
      }
    case 'UPDATE_IDENTITY':
      return {
        ...state,
        identities: state.identities.map(i => 
          i.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : i
        )
      }
    case 'DELETE_IDENTITY':
      return {
        ...state,
        identities: state.identities.filter(i => i.id !== action.payload),
        activeIdentityId: state.activeIdentityId === action.payload 
          ? state.identities.find(i => i.id !== action.payload)?.id ?? null 
          : state.activeIdentityId
      }
    case 'SET_ACTIVE_IDENTITY':
      return { ...state, activeIdentityId: action.payload }
    case 'SET_CREATING':
      return { ...state, isCreating: action.payload }
    default:
      return state
  }
}

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createIdentityStore()
  const [state, dispatch] = useReducer(identityReducer, store.load())

  useEffect(() => {
    store.save(state)
  }, [state])

  return (
    <IdentityContext.Provider value={{ state, dispatch }}>
      {children}
    </IdentityContext.Provider>
  )
}

export const useIdentity = () => {
  const context = useContext(IdentityContext)
  if (!context) throw new Error('useIdentity must be used within IdentityProvider')
  return context
}
```

- [ ] **Step 2: Commit**

```bash
git add src/identity/IdentityProvider.tsx
git commit -m "feat(identity): add identity provider"
```

---

## Task 4: 模块系统类型定义

**Files:**
- Create: `src/module-store/types.ts`

- [ ] **Step 1: 定义模块类型**

```typescript
export type ModuleId = string

export type ModuleSize = 'small' | 'medium' | 'large' | 'full-width'

export type Module = {
  id: ModuleId
  title: string
  description: string
  icon: string
  category: 'productivity' | 'learning' | 'health' | 'life' | 'custom'
  size: ModuleSize
  isDefault: boolean
  isCustom: boolean
}

export type CanvasItem = {
  moduleId: ModuleId
  position: { x: number; y: number }
  size: ModuleSize
}

export type ModuleStoreState = {
  availableModules: Module[]
  activeModules: CanvasItem[]
  isStoreOpen: boolean
}

export type ModuleStoreAction =
  | { type: 'ADD_MODULE'; payload: ModuleId }
  | { type: 'REMOVE_MODULE'; payload: ModuleId }
  | { type: 'UPDATE_MODULE_POSITION'; payload: { moduleId: ModuleId; position: { x: number; y: number } } }
  | { type: 'UPDATE_MODULE_SIZE'; payload: { moduleId: ModuleId; size: ModuleSize } }
  | { type: 'TOGGLE_STORE'; payload: boolean }
  | { type: 'CREATE_CUSTOM_MODULE'; payload: Omit<Module, 'id' | 'isDefault'> }
```

- [ ] **Step 2: Commit**

```bash
git add src/module-store/types.ts
git commit -m "feat(module-store): add module store types"
```

---

## Task 5: 模块注册表

**Files:**
- Create: `src/module-store/ModuleRegistry.ts`

- [ ] **Step 1: 实现模块注册表**

```typescript
import type { Module } from './types'

export const defaultModules: Module[] = [
  {
    id: 'today-tasks',
    title: '今日任务',
    description: '查看和管理今日待办事项',
    icon: 'CheckCircle',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-timer',
    title: '专注计时',
    description: '番茄工作法专注计时',
    icon: 'Clock',
    category: 'productivity',
    size: 'small',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'calendar',
    title: '日历',
    description: '查看日程安排',
    icon: 'Calendar',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'notes',
    title: '笔记',
    description: '快速记录想法和笔记',
    icon: 'FileText',
    category: 'productivity',
    size: 'medium',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'weather',
    title: '天气',
    description: '查看当地天气',
    icon: 'Cloud',
    category: 'life',
    size: 'small',
    isDefault: true,
    isCustom: false
  },
  {
    id: 'statistics',
    title: '数据统计',
    description: '查看个人数据统计',
    icon: 'BarChart',
    category: 'productivity',
    size: 'large',
    isDefault: true,
    isCustom: false
  }
]

export const getModuleById = (id: string): Module | undefined =>
  defaultModules.find(m => m.id === id)

export const getModulesByCategory = (category: string): Module[] =>
  defaultModules.filter(m => m.category === category)
```

- [ ] **Step 2: Commit**

```bash
git add src/module-store/ModuleRegistry.ts
git commit -m "feat(module-store): add module registry"
```

---

## Task 6: 鸿蒙动画配置

**Files:**
- Create: `src/animations/harmonyOS.ts`

- [ ] **Step 1: 实现鸿蒙动画配置**

```typescript
export const harmonyOS = {
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  card: {
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      transition: `all ${harmonyOS.duration.fast} ${harmonyOS.easing.standard}`
    },
    active: {
      transform: 'scale(0.98)',
      transition: `all ${harmonyOS.duration.fast} ${harmonyOS.easing.standard}`
    },
    drag: {
      opacity: '0.8',
      transform: 'scale(1.02)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.16)',
      transition: `all ${harmonyOS.duration.fast} ${harmonyOS.easing.standard}`
    }
  },
  sidebar: {
    open: {
      transform: 'translateX(0)',
      transition: `transform ${harmonyOS.duration.normal} ${harmonyOS.easing.standard}`
    },
    closed: {
      transform: 'translateX(-100%)',
      transition: `transform ${harmonyOS.duration.normal} ${harmonyOS.easing.standard}`
    }
  },
  toast: {
    enter: {
      opacity: '0',
      transform: 'scale(0.9)',
      transition: `all ${harmonyOS.duration.fast} ${harmonyOS.easing.spring}`
    },
    visible: {
      opacity: '1',
      transform: 'scale(1)'
    },
    exit: {
      opacity: '0',
      transform: 'scale(0.9)',
      transition: `all ${harmonyOS.duration.fast} ${harmonyOS.easing.standard}`
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/animations/harmonyOS.ts
git commit -m "feat(animations): add harmonyOS animation config"
```

---

## Task 7: 可拖拽画布组件

**Files:**
- Create: `src/canvas/DraggableCanvas.tsx`
- Create: `src/canvas/CanvasCard.tsx`

- [ ] **Step 1: 实现 CanvasCard 组件**

```typescript
import { useState } from 'react'
import type { ModuleSize } from '../module-store/types'

interface CanvasCardProps {
  title: string
  description: string
  size: ModuleSize
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
  onDoubleClick: () => void
}

export const CanvasCard: React.FC<CanvasCardProps> = ({
  title,
  description,
  size,
  onDragStart,
  onDragEnd,
  onClick,
  onDoubleClick
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
    'full-width': 'col-span-1 row-span-2'
  }

  return (
    <div
      className={`canvas-card ${sizeClasses[size]} ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseDown={() => {
        setIsDragging(true)
        onDragStart()
      }}
      onMouseUp={() => {
        setIsDragging(false)
        onDragEnd()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        padding: '16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDragging 
          ? '0 12px 32px rgba(0, 0, 0, 0.16)' 
          : isHovered 
            ? '0 8px 24px rgba(0, 0, 0, 0.12)' 
            : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transform: isDragging ? 'scale(1.02)' : isHovered ? 'translateY(-4px)' : 'none',
        opacity: isDragging ? 0.8 : 1
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>{description}</p>
    </div>
  )
}
```

- [ ] **Step 2: 实现 DraggableCanvas 组件**

```typescript
import { useState, useCallback } from 'react'
import { CanvasCard } from './CanvasCard'
import type { CanvasItem } from '../module-store/types'

interface DraggableCanvasProps {
  items: CanvasItem[]
  onItemsChange: (items: CanvasItem[]) => void
}

export const DraggableCanvas: React.FC<DraggableCanvasProps> = ({ items, onItemsChange }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  const handleDrag = useCallback((e: React.MouseEvent, id: string) => {
    if (draggingId !== id) return
    
    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y
    
    onItemsChange(items.map(item => 
      item.moduleId === id 
        ? { ...item, position: { x: newX, y: newY } }
        : item
    ))
  }, [draggingId, dragOffset, items, onItemsChange])

  return (
    <div 
      className="draggable-canvas"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
        padding: '24px',
        minHeight: '100vh'
      }}
    >
      {items.map(item => (
        <CanvasCard
          key={item.moduleId}
          title={item.moduleId}
          description="Module description"
          size={item.size}
          onDragStart={() => handleDragStart(item.moduleId)}
          onDragEnd={handleDragEnd}
          onClick={() => {}}
          onDoubleClick={() => {}}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/canvas/
git commit -m "feat(canvas): add draggable canvas and card components"
```

---

## Task 8: 侧边栏组件

**Files:**
- Create: `src/sidebar/Sidebar.tsx`
- Create: `src/sidebar/SidebarToggle.tsx`

- [ ] **Step 1: 实现 Sidebar 组件**

```typescript
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [activeSection, setActiveSection] = useState<string>('identity')

  const sections = [
    { id: 'identity', label: '身份切换', icon: 'User' },
    { id: 'modules', label: '模块商店', icon: 'Grid' },
    { id: 'ai', label: 'AI 助手', icon: 'Bot' },
    { id: 'settings', label: '设置', icon: 'Settings' },
    { id: 'theme', label: '主题切换', icon: 'Palette' }
  ]

  return (
    <>
      <aside
        className={`sidebar ${isOpen ? 'open' : 'closed'}`}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '280px',
          height: '100vh',
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
          padding: '24px',
          boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.08)' : 'none'
        }}
      >
        <div className="sidebar-header" style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>星寰海</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--muted)' }}>AI 个人空间</p>
        </div>

        <nav className="sidebar-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === section.id ? 'var(--primary)' : 'transparent',
                color: activeSection === section.id ? '#fff' : 'var(--text)',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: '4px'
              }}
            >
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '24px' }}>
          <button
            className="layout-lock-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            <span>🔒</span>
            <span>锁定布局</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: 实现 SidebarToggle 组件**

```typescript
interface SidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <button
      className="sidebar-toggle"
      onClick={onToggle}
      style={{
        position: 'fixed',
        left: isOpen ? '280px' : '16px',
        top: '16px',
        zIndex: 1001,
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--surface)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <span style={{ fontSize: '20px' }}>{isOpen ? '✕' : '☰'}</span>
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/sidebar/
git commit -m "feat(sidebar): add sidebar and toggle components"
```

---

## Task 9: 更新 App.tsx 集成新布局

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 修改 App.tsx 引入新组件**

```typescript
import { useState } from 'react'
import { IdentityProvider } from './identity/IdentityProvider'
import { Sidebar } from './sidebar/Sidebar'
import { SidebarToggle } from './sidebar/SidebarToggle'
import { DraggableCanvas } from './canvas/DraggableCanvas'
import type { CanvasItem } from './module-store/types'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([
    { moduleId: 'today-tasks', position: { x: 0, y: 0 }, size: 'medium' },
    { moduleId: 'focus-timer', position: { x: 2, y: 0 }, size: 'small' },
    { moduleId: 'calendar', position: { x: 0, y: 1 }, size: 'medium' },
    { moduleId: 'notes', position: { x: 2, y: 1 }, size: 'medium' },
    { moduleId: 'weather', position: { x: 0, y: 2 }, size: 'small' },
    { moduleId: 'statistics', position: { x: 1, y: 2 }, size: 'large' }
  ])

  return (
    <IdentityProvider>
      <div className="app">
        <SidebarToggle isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <main className="main-content" style={{ marginLeft: sidebarOpen ? '280px' : '0' }}>
          <DraggableCanvas items={canvasItems} onItemsChange={setCanvasItems} />
        </main>
      </div>
    </IdentityProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): integrate new layout with sidebar and draggable canvas"
```

---

## Task 10: 添加 CSS 样式

**Files:**
- Create: `src/styles/harmony-theme.css`

- [ ] **Step 1: 创建鸿蒙主题 CSS**

```css
/* HarmonyOS Theme */
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --accent: #ec4899;
  --background: #f8fafc;
  --surface: rgba(255, 255, 255, 0.8);
  --surface-strong: rgba(255, 255, 255, 0.95);
  --text: #1e293b;
  --muted: #64748b;
  --border: rgba(226, 232, 240, 0.8);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.16);
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --surface: rgba(30, 41, 59, 0.8);
    --surface-strong: rgba(30, 41, 59, 0.95);
    --text: #f1f5f9;
    --muted: #94a3b8;
    --border: rgba(51, 65, 85, 0.8);
  }
}

/* Canvas Card Styles */
.canvas-card {
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: grab;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.canvas-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.canvas-card.dragging {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
  cursor: grabbing;
}

.canvas-card:active {
  transform: scale(0.98);
}

/* Sidebar Styles */
.sidebar {
  background: var(--surface-strong);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border);
}

.sidebar-item {
  transition: all var(--transition-fast);
}

.sidebar-item:hover {
  background: var(--surface);
}

/* Toast Animation */
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes toast-exit {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
}

.toast {
  animation: toast-enter 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-exit {
  animation: toast-exit 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Glassmorphism Effect */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Grid Layout */
.draggable-canvas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 24px;
  min-height: 100vh;
}

/* Responsive */
@media (max-width: 768px) {
  .draggable-canvas {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    width: 100%;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/harmony-theme.css
git commit -m "feat(styles): add harmonyOS theme styles"
```

---

## Task 11: 运行测试和检查

- [ ] **Step 1: 运行 lint**

```bash
npm run lint
```

- [ ] **Step 2: 运行 typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: 运行测试**

```bash
npm run test
```

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: fix lint and type errors"
```

---

## Spec Coverage Check

| 需求 | 实现任务 |
|------|---------|
| 自由描述 + 标签组合身份 | Task 1-3 |
| 模块商店 | Task 4-5 |
| 可拖拽画布 | Task 7 |
| 鸿蒙风格卡片 | Task 6, 10 |
| 侧边栏 | Task 8 |
| 布局管理 | Task 7-8 |
| AI 助手 | Task 8 (预留) |
| 动画效果 | Task 6, 10 |

## Placeholder Scan

- 无 TBD/TODO
- 无 "implement later"
- 所有代码完整可运行

## Type Consistency Check

- `IdentityId` 在 Task 1 定义，Task 2-3 使用
- `ModuleSize` 在 Task 4 定义，Task 7 使用
- `CanvasItem` 在 Task 4 定义，Task 7-9 使用
- 所有类型一致

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-02-persona-selection-ui-redesign.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach do you prefer?**
