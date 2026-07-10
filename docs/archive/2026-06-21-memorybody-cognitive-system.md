# MemoryBody 认知记忆体系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建星寰海 MemoryBody 认知记忆体系统，让 AI 具备分层记忆、自然衰减、认知图谱、进化巩固、矛盾修正、用户纠错、隐私保护、场景检索和可视化记忆星图能力。

**Architecture:** 新建 `src/memory-body/` 作为新一代记忆体核心，采用深模块 + 浅适配器架构。旧 `src/memory/` 暂时保留为 LegacyMemory 兼容与迁移来源，现有知识图谱 UI 升级为 MemoryStarMap 展示层，AI 对话通过 Adapter 接入 MemoryBody，不允许 UI 直接写记忆规则。

**Tech Stack:** React + TypeScript + Vite + Vitest + localStorage/IndexedDB-compatible Store Adapter + existing AgentChatUI/agentRuntime + existing KnowledgeGraph UI.

---

## 0. 全局工程约束

### 0.1 任务档位

本任务属于完整档：涉及 AI 对话主链路、记忆系统、隐私安全、知识图谱、旧数据迁移、UI 重构、测试验证。执行时必须遵循：

- 不一次性改完所有模块
- 每个任务必须独立可验证
- 每个任务必须可回滚
- 不破坏旧记忆数据
- 不删除旧系统，直到迁移验证完成
- 不擅自提交 Git
- 所有敏感数据不得入记忆
- 每阶段完成后写入项目记忆和 handoff

### 0.2 当前已知风险

- 工作区已有大量未提交改动，执行前必须再次运行 `git status --short`，不得覆盖用户已有修改。
- 当前测试历史存在 `App.test.tsx` 与 `personaScheduler.test.ts` 失败，执行中需区分已有失败和新失败。
- 现有知识图谱是展示聚合图，不是认知图谱，不能直接作为 MemoryBody 核心。
- 用户曾误发类似 API Key 字符串，MemoryBody 必须将 API Key/Token/密码列为 forbidden，不入库。

### 0.3 执行前固定检查

每个实现阶段开始前执行：

```bash
git status --short
git branch --show-current
npm run lint -- --quiet
```

若 lint 因已有问题失败，记录失败文件和原因，不得盲修无关模块。

每个实现阶段结束后至少执行：

```bash
npx tsc --noEmit
npm run test -- --runInBand
npm run build
```

如果 `--runInBand` 不被 Vitest 支持，改用：

```bash
npm run test
```

---

## 1. 文件结构规划

### 1.1 新增目录

```text
src/memory-body/
├── core/
│   ├── memoryBodyTypes.ts
│   ├── memoryBodyConfig.ts
│   └── memoryBodyGuards.ts
├── store/
│   ├── memoryBodyStore.ts
│   ├── browserMemoryBodyStore.ts
│   └── inMemoryMemoryBodyStore.ts
├── safety/
│   ├── sensitiveMemoryClassifier.ts
│   ├── forbiddenMemoryFilter.ts
│   └── memoryPrivacyGuard.ts
├── ingest/
│   ├── memoryIngestor.ts
│   ├── chatIngestor.ts
│   └── workspaceIngestor.ts
├── extract/
│   ├── memoryExtractor.ts
│   ├── ruleBasedMemoryExtractor.ts
│   └── entityNormalizer.ts
├── graph/
│   ├── memoryGraphStore.ts
│   ├── relationResolver.ts
│   ├── contradictionDetector.ts
│   └── graphTraversal.ts
├── evolution/
│   ├── memoryEvolutionEngine.ts
│   ├── beliefUpdater.ts
│   └── memoryConsolidator.ts
├── decay/
│   ├── memoryDecayEngine.ts
│   └── strengthScorer.ts
├── retrieve/
│   ├── memoryRetrievalEngine.ts
│   ├── contextRanker.ts
│   ├── memoryContextBuilder.ts
│   └── scenarioMemorySelector.ts
├── feedback/
│   └── memoryFeedbackService.ts
├── adapters/
│   ├── agentChatMemoryAdapter.ts
│   ├── legacyMemoryAdapter.ts
│   ├── knowledgeGraphMemoryAdapter.ts
│   └── workspaceMemoryAdapter.ts
├── migration/
│   ├── migrateLegacyMemory.ts
│   ├── migrateChatHistory.ts
│   └── migrateKnowledgeGraphSources.ts
├── evaluation/
│   ├── memoryDiagnostics.ts
│   └── memoryEvaluation.ts
└── index.ts
```

### 1.2 新增测试目录

```text
src/memory-body/__tests__/
├── memoryBodyTypes.test.ts
├── memoryBodyStore.test.ts
├── memoryPrivacyGuard.test.ts
├── memoryIngestor.test.ts
├── ruleBasedMemoryExtractor.test.ts
├── contradictionDetector.test.ts
├── memoryEvolutionEngine.test.ts
├── memoryDecayEngine.test.ts
├── memoryRetrievalEngine.test.ts
├── memoryContextBuilder.test.ts
├── memoryFeedbackService.test.ts
└── memoryMigration.test.ts
```

### 1.3 后续会修改的既有文件

```text
src/agent/AgentChatUI.tsx
src/agent/agentRuntime.ts
src/App.tsx
src/knowledge-graph/knowledgeGraphService.ts
src/knowledge-graph/KnowledgeGraphUI.tsx
src/components/knowledge-graph/KnowledgeGraphModal.tsx
src/memory/memoryObserver.ts
src/memory/memoryStore.ts
```

修改顺序必须晚于新 MemoryBody 核心测试通过。

---

## 2. 模块边界

### 2.1 深模块

这些模块封装复杂逻辑，必须有单元测试：

- `MemoryPrivacyGuard`
- `RuleBasedMemoryExtractor`
- `MemoryGraphStore`
- `ContradictionDetector`
- `MemoryEvolutionEngine`
- `MemoryDecayEngine`
- `MemoryRetrievalEngine`
- `MemoryContextBuilder`
- `MemoryFeedbackService`

### 2.2 浅适配器

这些模块只做接入，不允许写复杂规则：

- `AgentChatMemoryAdapter`
- `LegacyMemoryAdapter`
- `KnowledgeGraphMemoryAdapter`
- `WorkspaceMemoryAdapter`

### 2.3 禁止行为

- 禁止在 `AgentChatUI.tsx` 内新增复杂记忆规则
- 禁止在 `KnowledgeGraphUI.tsx` 内直接修改记忆数据
- 禁止绕过 safety 层直接写 Store
- 禁止将 API Key、Token、密码、连接串写入 MemoryAtom
- 禁止删除旧 `src/memory/`，直到迁移验证完成

---

## Task 1: MemoryBody Core 领域模型

**Files:**
- Create: `src/memory-body/core/memoryBodyTypes.ts`
- Create: `src/memory-body/core/memoryBodyConfig.ts`
- Create: `src/memory-body/core/memoryBodyGuards.ts`
- Create: `src/memory-body/__tests__/memoryBodyTypes.test.ts`
- Create: `src/memory-body/index.ts`

### Goal

建立稳定领域语言，为后续所有模块提供统一类型，不依赖 React/UI/旧 memory 系统。

- [ ] **Step 1: 写类型测试**

Create `src/memory-body/__tests__/memoryBodyTypes.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { createMemoryBodyState, isActiveMemoryAtom, isProtectedMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'

describe('memory body core types', () => {
  it('creates an empty memory body state', () => {
    const state = createMemoryBodyState('user-1', 'project-1')

    expect(state.version).toBe(1)
    expect(state.scope).toEqual({ userId: 'user-1', projectId: 'project-1' })
    expect(state.atoms).toEqual([])
    expect(state.entities).toEqual([])
    expect(state.relations).toEqual([])
    expect(state.beliefs).toEqual([])
  })

  it('distinguishes active and protected memory atoms', () => {
    const atom: MemoryAtom = {
      id: 'atom-1',
      scope: { userId: 'user-1', projectId: 'project-1' },
      layer: 'semantic',
      type: 'preference',
      subject: 'user',
      predicate: 'likes',
      object: '西瓜',
      content: '用户喜欢西瓜',
      source: 'chat',
      confidence: 0.86,
      strength: 0.72,
      emotionalWeight: 0.2,
      sensitivity: 'personal',
      lifecycle: 'protected',
      evidence: [],
      tags: ['food'],
      createdAt: '2026-06-21T00:00:00.000Z',
      updatedAt: '2026-06-21T00:00:00.000Z',
      lastAccessedAt: '2026-06-21T00:00:00.000Z',
      accessCount: 0,
      contradictionOf: []
    }

    expect(isActiveMemoryAtom(atom)).toBe(true)
    expect(isProtectedMemoryAtom(atom)).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/memory-body/__tests__/memoryBodyTypes.test.ts
```

Expected: FAIL，因为文件尚未创建。

- [ ] **Step 3: 创建核心类型**

Create `src/memory-body/core/memoryBodyTypes.ts`:

```typescript
export type MemoryLayer = 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'relational'

export type MemoryAtomType =
  | 'preference'
  | 'boundary'
  | 'goal'
  | 'habit'
  | 'emotion'
  | 'identity'
  | 'relationship'
  | 'interaction_style'
  | 'event'
  | 'insight'
  | 'system'

export type MemorySource =
  | 'chat'
  | 'workspace'
  | 'journal'
  | 'goal'
  | 'focus'
  | 'quicknote'
  | 'reading'
  | 'mood'
  | 'manual'
  | 'migration'
  | 'system'

export type MemorySensitivity = 'public' | 'personal' | 'sensitive' | 'private' | 'forbidden'

export type MemoryLifecycle =
  | 'draft'
  | 'active'
  | 'confirmed'
  | 'stable'
  | 'weakening'
  | 'archived'
  | 'contradicted'
  | 'protected'
  | 'forbidden'

export type MemoryScenario =
  | 'general'
  | 'chat'
  | 'study'
  | 'focus'
  | 'goal_planning'
  | 'emotional_support'
  | 'food_recommendation'
  | 'reflection'
  | 'knowledge_graph'

export type RelationType =
  | 'likes'
  | 'dislikes'
  | 'prefers'
  | 'avoids'
  | 'is_a'
  | 'part_of'
  | 'associated_with'
  | 'causes'
  | 'reduces'
  | 'supports'
  | 'conflicts_with'
  | 'requires'
  | 'responds_to'
  | 'belongs_to'

export type EntityType =
  | 'user'
  | 'food'
  | 'person'
  | 'goal'
  | 'habit'
  | 'emotion'
  | 'topic'
  | 'task'
  | 'time'
  | 'place'
  | 'subject'
  | 'persona'
  | 'boundary'
  | 'style'
  | 'unknown'

export interface MemoryScope {
  userId: string
  projectId: string
}

export interface MemoryEvidence {
  id: string
  source: MemorySource
  sourceId?: string
  sourceText: string
  timestamp: string
  confidence: number
}

export interface MemoryAtom {
  id: string
  scope: MemoryScope
  layer: MemoryLayer
  type: MemoryAtomType
  subject: string
  predicate: string
  object: string
  content: string
  source: MemorySource
  confidence: number
  strength: number
  emotionalWeight: number
  sensitivity: MemorySensitivity
  lifecycle: MemoryLifecycle
  evidence: MemoryEvidence[]
  tags: string[]
  scenarios?: MemoryScenario[]
  conditions?: Record<string, string | number | boolean>
  createdAt: string
  updatedAt: string
  lastAccessedAt: string
  accessCount: number
  contradictionOf: string[]
}

export interface MemoryEntity {
  id: string
  scope: MemoryScope
  name: string
  normalizedName: string
  type: EntityType
  aliases: string[]
  attributes: Record<string, string | number | boolean>
  sensitivity: MemorySensitivity
  createdAt: string
  updatedAt: string
}

export interface MemoryRelation {
  id: string
  scope: MemoryScope
  fromEntityId: string
  toEntityId: string
  relationType: RelationType
  confidence: number
  strength: number
  evidenceAtomIds: string[]
  lifecycle: MemoryLifecycle
  createdAt: string
  updatedAt: string
}

export interface UserBelief {
  id: string
  scope: MemoryScope
  field: string
  value: string | string[] | number | boolean | Record<string, unknown>
  confidence: number
  strength: number
  stability: 'emerging' | 'stable' | 'changing' | 'uncertain'
  sensitivity: MemorySensitivity
  scenario?: MemoryScenario
  updatedByAtomIds: string[]
  createdAt: string
  updatedAt: string
}

export interface MemoryBodyMeta {
  createdAt: string
  updatedAt: string
  lastDecayAt?: string
  lastMigrationAt?: string
  totalInteractions: number
  totalCorrections: number
  maturityLevel: number
}

export interface MemoryBodyState {
  version: 1
  scope: MemoryScope
  atoms: MemoryAtom[]
  entities: MemoryEntity[]
  relations: MemoryRelation[]
  beliefs: UserBelief[]
  meta: MemoryBodyMeta
}
```

Create `src/memory-body/core/memoryBodyConfig.ts`:

```typescript
import type { MemoryLifecycle, MemorySensitivity } from './memoryBodyTypes'

export const MEMORY_BODY_VERSION = 1

export const MEMORY_BODY_STORAGE_KEY = 'xinghuanhai-memory-body-state'

export const ACTIVE_MEMORY_LIFECYCLES: MemoryLifecycle[] = [
  'active',
  'confirmed',
  'stable',
  'protected'
]

export const WRITABLE_MEMORY_SENSITIVITIES: MemorySensitivity[] = [
  'public',
  'personal',
  'sensitive',
  'private'
]

export const DEFAULT_MEMORY_CONFIDENCE = 0.7
export const DEFAULT_MEMORY_STRENGTH = 0.5
export const DEFAULT_EMOTIONAL_WEIGHT = 0.1
```

Create `src/memory-body/core/memoryBodyGuards.ts`:

```typescript
import { ACTIVE_MEMORY_LIFECYCLES, MEMORY_BODY_VERSION } from './memoryBodyConfig'
import type { MemoryAtom, MemoryBodyState, MemoryScope } from './memoryBodyTypes'

export function createMemoryBodyState(userId: string, projectId: string, now = new Date().toISOString()): MemoryBodyState {
  return {
    version: MEMORY_BODY_VERSION,
    scope: { userId, projectId },
    atoms: [],
    entities: [],
    relations: [],
    beliefs: [],
    meta: {
      createdAt: now,
      updatedAt: now,
      totalInteractions: 0,
      totalCorrections: 0,
      maturityLevel: 0
    }
  }
}

export function sameMemoryScope(left: MemoryScope, right: MemoryScope): boolean {
  return left.userId === right.userId && left.projectId === right.projectId
}

export function normalizeScore(score: number): number {
  return Math.max(0, Math.min(1, score))
}

export function isActiveMemoryAtom(atom: MemoryAtom): boolean {
  return ACTIVE_MEMORY_LIFECYCLES.includes(atom.lifecycle)
}

export function isProtectedMemoryAtom(atom: MemoryAtom): boolean {
  return atom.lifecycle === 'protected'
}

export function isForbiddenMemoryAtom(atom: MemoryAtom): boolean {
  return atom.lifecycle === 'forbidden' || atom.sensitivity === 'forbidden'
}
```

Create `src/memory-body/index.ts`:

```typescript
export type * from './core/memoryBodyTypes'
export * from './core/memoryBodyConfig'
export * from './core/memoryBodyGuards'
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run src/memory-body/__tests__/memoryBodyTypes.test.ts
```

Expected: PASS.

- [ ] **Step 5: 类型检查**

```bash
npx tsc --noEmit
```

Expected: PASS 或仅出现已知既有失败，若出现 memory-body 新错误必须修复。

- [ ] **Step 6: 项目记忆记录**

写入项目记忆：`MemoryBody Core 已完成，领域模型成为后续模块唯一类型来源。`

---

## Task 2: MemoryBody Store 持久化层

**Files:**
- Create: `src/memory-body/store/memoryBodyStore.ts`
- Create: `src/memory-body/store/inMemoryMemoryBodyStore.ts`
- Create: `src/memory-body/store/browserMemoryBodyStore.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryBodyStore.test.ts`

### Goal

建立可替换存储接口。当前实现 localStorage 和 in-memory，未来可替换 IndexedDB/Supabase，不允许业务模块直接读写 localStorage。

- [ ] **Step 1: 写 Store 测试**

Create `src/memory-body/__tests__/memoryBodyStore.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { createInMemoryMemoryBodyStore } from '../store/inMemoryMemoryBodyStore'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createAtom(id: string, object: string): MemoryAtom {
  return {
    id,
    scope: { userId: 'user-1', projectId: 'project-1' },
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object,
    content: `用户喜欢${object}`,
    source: 'chat',
    confidence: 0.8,
    strength: 0.6,
    emotionalWeight: 0.2,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: ['food'],
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
    lastAccessedAt: '2026-06-21T00:00:00.000Z',
    accessCount: 0,
    contradictionOf: []
  }
}

describe('memory body store', () => {
  it('upserts and lists active atoms by scope', () => {
    const store = createInMemoryMemoryBodyStore('user-1', 'project-1')
    store.upsertAtom(createAtom('atom-1', '西瓜'))

    expect(store.listActiveAtoms({ userId: 'user-1', projectId: 'project-1' })).toHaveLength(1)
    expect(store.listActiveAtoms({ userId: 'user-2', projectId: 'project-1' })).toHaveLength(0)
  })

  it('archives atoms without deleting evidence', () => {
    const store = createInMemoryMemoryBodyStore('user-1', 'project-1')
    store.upsertAtom(createAtom('atom-1', '西瓜'))
    const archived = store.archiveAtom('atom-1', '2026-06-22T00:00:00.000Z')

    const state = store.load()
    expect(archived).toBe(true)
    expect(state.atoms[0].lifecycle).toBe('archived')
    expect(state.atoms[0].updatedAt).toBe('2026-06-22T00:00:00.000Z')
  })

  it('marks atoms forbidden when forgotten', () => {
    const store = createInMemoryMemoryBodyStore('user-1', 'project-1')
    store.upsertAtom(createAtom('atom-1', '西瓜'))
    const forgotten = store.forgetAtom('atom-1', '2026-06-22T00:00:00.000Z')

    const state = store.load()
    expect(forgotten).toBe(true)
    expect(state.atoms[0].lifecycle).toBe('forbidden')
    expect(state.atoms[0].sensitivity).toBe('forbidden')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/memory-body/__tests__/memoryBodyStore.test.ts
```

Expected: FAIL，因为 Store 尚未实现。

- [ ] **Step 3: 实现 Store 接口**

Create `src/memory-body/store/memoryBodyStore.ts`:

```typescript
import type { MemoryAtom, MemoryBodyState, MemoryEntity, MemoryRelation, MemoryScope, UserBelief } from '../core/memoryBodyTypes'

export interface MemoryBodyStore {
  load: () => MemoryBodyState
  save: (state: MemoryBodyState) => void
  upsertAtom: (atom: MemoryAtom) => void
  upsertEntity: (entity: MemoryEntity) => void
  upsertRelation: (relation: MemoryRelation) => void
  upsertBelief: (belief: UserBelief) => void
  listActiveAtoms: (scope: MemoryScope) => MemoryAtom[]
  archiveAtom: (atomId: string, updatedAt: string) => boolean
  forgetAtom: (atomId: string, updatedAt: string) => boolean
}

export interface LocalStorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}
```

Create `src/memory-body/store/inMemoryMemoryBodyStore.ts`:

```typescript
import { createMemoryBodyState, isActiveMemoryAtom, sameMemoryScope } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryBodyState, MemoryEntity, MemoryRelation, UserBelief } from '../core/memoryBodyTypes'
import type { MemoryBodyStore } from './memoryBodyStore'

function cloneState(state: MemoryBodyState): MemoryBodyState {
  return structuredClone(state)
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return [...items.filter(existing => existing.id !== item.id), item]
}

export function createInMemoryMemoryBodyStore(userId: string, projectId: string, initialState?: MemoryBodyState): MemoryBodyStore {
  let state = cloneState(initialState ?? createMemoryBodyState(userId, projectId))

  const updateMeta = (updatedAt: string) => {
    state = { ...state, meta: { ...state.meta, updatedAt } }
  }

  return {
    load: () => cloneState(state),
    save: (nextState) => {
      state = cloneState(nextState)
    },
    upsertAtom: (atom: MemoryAtom) => {
      state = { ...state, atoms: upsertById(state.atoms, atom) }
      updateMeta(atom.updatedAt)
    },
    upsertEntity: (entity: MemoryEntity) => {
      state = { ...state, entities: upsertById(state.entities, entity) }
      updateMeta(entity.updatedAt)
    },
    upsertRelation: (relation: MemoryRelation) => {
      state = { ...state, relations: upsertById(state.relations, relation) }
      updateMeta(relation.updatedAt)
    },
    upsertBelief: (belief: UserBelief) => {
      state = { ...state, beliefs: upsertById(state.beliefs, belief) }
      updateMeta(belief.updatedAt)
    },
    listActiveAtoms: (scope) => state.atoms.filter(atom => sameMemoryScope(atom.scope, scope) && isActiveMemoryAtom(atom)),
    archiveAtom: (atomId, updatedAt) => {
      let changed = false
      state = {
        ...state,
        atoms: state.atoms.map(atom => {
          if (atom.id !== atomId) return atom
          changed = true
          return { ...atom, lifecycle: 'archived', updatedAt }
        })
      }
      if (changed) updateMeta(updatedAt)
      return changed
    },
    forgetAtom: (atomId, updatedAt) => {
      let changed = false
      state = {
        ...state,
        atoms: state.atoms.map(atom => {
          if (atom.id !== atomId) return atom
          changed = true
          return { ...atom, lifecycle: 'forbidden', sensitivity: 'forbidden', updatedAt }
        })
      }
      if (changed) updateMeta(updatedAt)
      return changed
    }
  }
}
```

Create `src/memory-body/store/browserMemoryBodyStore.ts`:

```typescript
import { MEMORY_BODY_STORAGE_KEY } from '../core/memoryBodyConfig'
import { createMemoryBodyState } from '../core/memoryBodyGuards'
import type { MemoryBodyState } from '../core/memoryBodyTypes'
import { createInMemoryMemoryBodyStore } from './inMemoryMemoryBodyStore'
import type { LocalStorageLike, MemoryBodyStore } from './memoryBodyStore'

function isMemoryBodyState(value: unknown): value is MemoryBodyState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MemoryBodyState>
  return candidate.version === 1 && Array.isArray(candidate.atoms) && Array.isArray(candidate.entities) && Array.isArray(candidate.relations) && Array.isArray(candidate.beliefs)
}

export function createBrowserMemoryBodyStore(userId: string, projectId: string, storage: LocalStorageLike = window.localStorage, storageKey = MEMORY_BODY_STORAGE_KEY): MemoryBodyStore {
  const loadState = () => {
    const raw = storage.getItem(storageKey)
    if (!raw) return createMemoryBodyState(userId, projectId)
    try {
      const parsed = JSON.parse(raw) as unknown
      return isMemoryBodyState(parsed) ? parsed : createMemoryBodyState(userId, projectId)
    } catch {
      return createMemoryBodyState(userId, projectId)
    }
  }

  const memoryStore = createInMemoryMemoryBodyStore(userId, projectId, loadState())
  const persist = () => storage.setItem(storageKey, JSON.stringify(memoryStore.load()))

  return {
    load: memoryStore.load,
    save: (state) => {
      memoryStore.save(state)
      persist()
    },
    upsertAtom: (atom) => {
      memoryStore.upsertAtom(atom)
      persist()
    },
    upsertEntity: (entity) => {
      memoryStore.upsertEntity(entity)
      persist()
    },
    upsertRelation: (relation) => {
      memoryStore.upsertRelation(relation)
      persist()
    },
    upsertBelief: (belief) => {
      memoryStore.upsertBelief(belief)
      persist()
    },
    listActiveAtoms: memoryStore.listActiveAtoms,
    archiveAtom: (atomId, updatedAt) => {
      const changed = memoryStore.archiveAtom(atomId, updatedAt)
      persist()
      return changed
    },
    forgetAtom: (atomId, updatedAt) => {
      const changed = memoryStore.forgetAtom(atomId, updatedAt)
      persist()
      return changed
    }
  }
}
```

Modify `src/memory-body/index.ts`:

```typescript
export type * from './core/memoryBodyTypes'
export * from './core/memoryBodyConfig'
export * from './core/memoryBodyGuards'
export type * from './store/memoryBodyStore'
export * from './store/inMemoryMemoryBodyStore'
export * from './store/browserMemoryBodyStore'
```

- [ ] **Step 4: 运行 Store 测试**

```bash
npx vitest run src/memory-body/__tests__/memoryBodyStore.test.ts
```

Expected: PASS.

- [ ] **Step 5: 类型检查**

```bash
npx tsc --noEmit
```

Expected: PASS 或仅出现已知既有失败。

---

## Task 3: Safety First 写入安全层

**Files:**
- Create: `src/memory-body/safety/sensitiveMemoryClassifier.ts`
- Create: `src/memory-body/safety/forbiddenMemoryFilter.ts`
- Create: `src/memory-body/safety/memoryPrivacyGuard.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryPrivacyGuard.test.ts`

### Goal

任何记忆写入前必须经过安全层。API Key、Token、密码、连接串、私密凭据不得写入 MemoryBody。

- [ ] **Step 1: 写安全测试**

Create `src/memory-body/__tests__/memoryPrivacyGuard.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { guardMemoryWrite } from '../safety/memoryPrivacyGuard'

describe('memory privacy guard', () => {
  it('blocks api keys and tokens', () => {
    const result = guardMemoryWrite({
      content: '我的 API Key 是 sk-1234567890abcdef',
      source: 'chat'
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('forbidden_secret')
  })

  it('allows harmless preferences', () => {
    const result = guardMemoryWrite({
      content: '我喜欢吃西瓜',
      source: 'chat'
    })

    expect(result.allowed).toBe(true)
    expect(result.sensitivity).toBe('personal')
  })

  it('marks user no-memory instruction as forbidden', () => {
    const result = guardMemoryWrite({
      content: '这个不要记',
      source: 'chat'
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('user_requested_no_memory')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/memory-body/__tests__/memoryPrivacyGuard.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现安全层**

Create `src/memory-body/safety/sensitiveMemoryClassifier.ts`:

```typescript
import type { MemorySensitivity, MemorySource } from '../core/memoryBodyTypes'

export interface SensitivityInput {
  content: string
  source: MemorySource
}

export interface SensitivityResult {
  sensitivity: MemorySensitivity
  matchedPatterns: string[]
}

const forbiddenPatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: 'api_key', pattern: /\b(?:api[_-]?key|apikey|secret|token)\b\s*(?:是|=|:)?\s*[a-zA-Z0-9_\-:.]{12,}/i },
  { name: 'openai_key', pattern: /sk-[a-zA-Z0-9]{12,}/i },
  { name: 'password', pattern: /\b(?:密码|password|passwd|pwd)\b\s*(?:是|=|:)?\s*\S{6,}/i },
  { name: 'database_url', pattern: /(postgres|mysql|mongodb|redis):\/\/[^\s]+/i },
  { name: 'private_key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i }
]

const sensitivePatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: 'family_private', pattern: /(家庭矛盾|家里吵架|父母关系|亲密关系)/ },
  { name: 'mental_health', pattern: /(抑郁|自残|崩溃|焦虑症|心理疾病)/ },
  { name: 'financial_private', pattern: /(负债|欠款|收入|工资|银行卡)/ }
]

export function classifyMemorySensitivity(input: SensitivityInput): SensitivityResult {
  const forbidden = forbiddenPatterns.filter(item => item.pattern.test(input.content)).map(item => item.name)
  if (forbidden.length > 0) return { sensitivity: 'forbidden', matchedPatterns: forbidden }

  const sensitive = sensitivePatterns.filter(item => item.pattern.test(input.content)).map(item => item.name)
  if (sensitive.length > 0) return { sensitivity: 'sensitive', matchedPatterns: sensitive }

  return { sensitivity: 'personal', matchedPatterns: [] }
}
```

Create `src/memory-body/safety/forbiddenMemoryFilter.ts`:

```typescript
export interface ForbiddenMemoryResult {
  forbidden: boolean
  reason?: 'user_requested_no_memory' | 'forbidden_secret'
}

const noMemoryPatterns = [
  /不要记/i,
  /别记/i,
  /不要保存/i,
  /不要写入记忆/i,
  /这段别记/i,
  /临时聊天/i
]

export function detectForbiddenMemoryInstruction(content: string): ForbiddenMemoryResult {
  if (noMemoryPatterns.some(pattern => pattern.test(content))) {
    return { forbidden: true, reason: 'user_requested_no_memory' }
  }
  return { forbidden: false }
}
```

Create `src/memory-body/safety/memoryPrivacyGuard.ts`:

```typescript
import type { MemorySensitivity, MemorySource } from '../core/memoryBodyTypes'
import { detectForbiddenMemoryInstruction } from './forbiddenMemoryFilter'
import { classifyMemorySensitivity } from './sensitiveMemoryClassifier'

export interface MemoryWriteGuardInput {
  content: string
  source: MemorySource
}

export interface MemoryWriteGuardResult {
  allowed: boolean
  sensitivity: MemorySensitivity
  reason?: 'user_requested_no_memory' | 'forbidden_secret'
  matchedPatterns: string[]
}

export function guardMemoryWrite(input: MemoryWriteGuardInput): MemoryWriteGuardResult {
  const forbiddenInstruction = detectForbiddenMemoryInstruction(input.content)
  if (forbiddenInstruction.forbidden) {
    return {
      allowed: false,
      sensitivity: 'forbidden',
      reason: forbiddenInstruction.reason,
      matchedPatterns: []
    }
  }

  const sensitivity = classifyMemorySensitivity(input)
  if (sensitivity.sensitivity === 'forbidden') {
    return {
      allowed: false,
      sensitivity: 'forbidden',
      reason: 'forbidden_secret',
      matchedPatterns: sensitivity.matchedPatterns
    }
  }

  return {
    allowed: true,
    sensitivity: sensitivity.sensitivity,
    matchedPatterns: sensitivity.matchedPatterns
  }
}
```

Modify `src/memory-body/index.ts`:

```typescript
export type * from './core/memoryBodyTypes'
export * from './core/memoryBodyConfig'
export * from './core/memoryBodyGuards'
export type * from './store/memoryBodyStore'
export * from './store/inMemoryMemoryBodyStore'
export * from './store/browserMemoryBodyStore'
export * from './safety/sensitiveMemoryClassifier'
export * from './safety/forbiddenMemoryFilter'
export * from './safety/memoryPrivacyGuard'
```

- [ ] **Step 4: 运行安全测试**

```bash
npx vitest run src/memory-body/__tests__/memoryPrivacyGuard.test.ts
```

Expected: PASS.

---

## Task 4: RuleBasedMemoryExtractor 记忆抽取器

**Files:**
- Create: `src/memory-body/extract/entityNormalizer.ts`
- Create: `src/memory-body/extract/memoryExtractor.ts`
- Create: `src/memory-body/extract/ruleBasedMemoryExtractor.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/ruleBasedMemoryExtractor.test.ts`

### Goal

将用户输入转换为 MemoryAtom、MemoryEntity、MemoryRelation 草案。规则抽取是基础能力，AI 增强以后再接入。

### Key Cases

- “我喜欢吃西瓜” → likes relation + preference atom
- “不要催我” → boundary + procedural memory
- “我现在不喜欢太甜” → dislikes relation + condition
- “我压力大时先别安排任务” → emotional/procedural conditional memory

### Steps

- [ ] **Step 1: 编写测试**
- [ ] **Step 2: 实现 `normalizeEntityName()`**
- [ ] **Step 3: 实现 `extractMemoryDrafts()`**
- [ ] **Step 4: 验证所有 Key Cases 通过**

测试命令：

```bash
npx vitest run src/memory-body/__tests__/ruleBasedMemoryExtractor.test.ts
```

验收：4 个 Key Cases 均产出正确 type、predicate、object、sensitivity、lifecycle。

---

## Task 5: MemoryIngestor 统一摄取入口

**Files:**
- Create: `src/memory-body/ingest/memoryIngestor.ts`
- Create: `src/memory-body/ingest/chatIngestor.ts`
- Create: `src/memory-body/ingest/workspaceIngestor.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryIngestor.test.ts`

### Goal

所有写入统一走 ingest：先 safety，再 extract，再 store。禁止外部直接写 Atom。

### Required Flow

```text
input → guardMemoryWrite → extractMemoryDrafts → normalize ids → upsert store → return result
```

### Acceptance

- harmless preference 写入成功
- API Key 被拒绝且不入 Store
- “不要记”被拒绝且不入 Store
- evidence 包含原始文本、source、timestamp

---

## Task 6: MemoryGraph + ContradictionDetector

**Files:**
- Create: `src/memory-body/graph/memoryGraphStore.ts`
- Create: `src/memory-body/graph/relationResolver.ts`
- Create: `src/memory-body/graph/contradictionDetector.ts`
- Create: `src/memory-body/graph/graphTraversal.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/contradictionDetector.test.ts`

### Goal

建立认知图谱和矛盾检测能力。

### Acceptance

- `user likes 西瓜` + `user dislikes 西瓜` 被判定为直接矛盾
- `user likes 甜食` + `user dislikes 太甜` 被判定为语义细化，不直接覆盖
- 矛盾时旧 atom 标记 `contradicted`，新 atom 保持 `active`
- relation 支持 `conflicts_with`

---

## Task 7: MemoryEvolution 进化与巩固

**Files:**
- Create: `src/memory-body/evolution/memoryEvolutionEngine.ts`
- Create: `src/memory-body/evolution/beliefUpdater.ts`
- Create: `src/memory-body/evolution/memoryConsolidator.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryEvolutionEngine.test.ts`

### Goal

让记忆越用越稳：重复确认增强，低质量记忆保持 draft，高质量记忆投影为 UserBelief。

### Acceptance

- 同一偏好出现 3 次后 atom lifecycle 从 `active` 转为 `confirmed`
- 强度超过阈值后生成 `UserBelief`
- 用户纠错后降低 belief confidence
- 多条 “西瓜/冰饮/清爽” 记忆可归纳为 `preferences.food_style=清爽低负担`

---

## Task 8: MemoryDecay 生命周期与自然衰减

**Files:**
- Create: `src/memory-body/decay/strengthScorer.ts`
- Create: `src/memory-body/decay/memoryDecayEngine.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryDecayEngine.test.ts`

### Goal

长期不用的记忆自然减弱，但 protected/sensitive 重要边界不被自动遗忘。

### Acceptance

- 普通 active atom 30 天未访问 strength 降低
- protected atom 不衰减
- forbidden atom 不参与衰减，只保持不可用
- strength 低于阈值后 lifecycle 变为 `archived`
- accessCount 增加后 strength 提升

---

## Task 9: MemoryRetrieval + ContextBuilder

**Files:**
- Create: `src/memory-body/retrieve/contextRanker.ts`
- Create: `src/memory-body/retrieve/scenarioMemorySelector.ts`
- Create: `src/memory-body/retrieve/memoryRetrievalEngine.ts`
- Create: `src/memory-body/retrieve/memoryContextBuilder.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryContextBuilder.test.ts`

### Goal

按当前消息和场景检索相关记忆，并生成给 AI 的分层上下文。

### Context Priority

```text
P0 安全边界
P1 用户明确要求
P2 回应方式
P3 当前状态
P4 长期信念
P5 相关情节记忆
P6 图谱关联
P7 低置信度观察
```

### Acceptance

- “今天吃什么” 检索 food preference，不检索无关目标
- “我压力大” 检索 emotional/procedural/boundary memory
- sensitive memory 可隐性影响语气，但不直接复述细节
- forbidden memory 不进入 context
- 低置信度记忆使用“可能/如果我没记错”的措辞

---

## Task 10: AgentChat Memory Adapter 接入

**Files:**
- Create: `src/memory-body/adapters/agentChatMemoryAdapter.ts`
- Modify: `src/agent/agentRuntime.ts`
- Modify: `src/agent/AgentChatUI.tsx`
- Create: `src/memory-body/__tests__/agentChatMemoryAdapter.test.ts`

### Goal

AI 对话开始使用 MemoryBody：回复前 buildContext，回复后 ingest。旧 memoryObserver 暂时保留，避免破坏已有链路。

### Acceptance

- 用户说“我喜欢吃西瓜”后 MemoryBody 写入 preference atom
- 下次输入“今天吃什么”时 context 包含清爽/西瓜偏好
- 用户说“这个不要记”不写入 MemoryBody
- 用户说“你记错了”进入 feedback 流程
- 旧 memoryObserver 仍可工作，直到迁移完成

### Browser Verification

- 启动 `npm run dev`
- 打开本地页面
- 打开 AI 聊天
- 输入“我喜欢吃西瓜”
- 关闭再打开
- 输入“你还记得我喜欢什么吗”
- 验证 AI 能自然引用，不机械背诵

---

## Task 11: MemoryFeedback 用户纠错

**Files:**
- Create: `src/memory-body/feedback/memoryFeedbackService.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryFeedbackService.test.ts`

### Goal

支持用户校准记忆：记得对、记错了、不要再提、这个很重要、忘掉这个。

### Acceptance

- `confirm` 增强 confidence/strength
- `wrong` 降低 confidence 并标记 evidence
- `important` 转为 protected
- `dontMention` 保留但不进入显性 context
- `forget` 转为 forbidden

---

## Task 12: MemoryCenter 我的记忆体 UI

**Files:**
- Create: `src/components/memory-body/MemoryCenterModal.tsx`
- Create: `src/components/memory-body/MemoryCenterUI.tsx`
- Create: `src/components/memory-body/MemoryCenterUI.module.css`
- Modify: `src/App.tsx`
- Modify: `src/sidebar/Sidebar.tsx`
- Modify: `src/hooks/useSidebarCallbacks.ts`

### Goal

提供用户可见、可控、可纠错的记忆中心。

### UI Sections

```text
AI 已了解我
AI 正在学习我
重要记忆
不要记
记忆时间线
```

### Acceptance

- 用户可以查看 active/confirmed/stable/protected 记忆
- 用户可以将记忆标记重要
- 用户可以删除/禁止记忆
- 用户可以纠错
- 移动端可滚动，无横向溢出
- Console 无错误

---

## Task 13: KnowledgeGraph → MemoryStarMap

**Files:**
- Create: `src/memory-body/adapters/knowledgeGraphMemoryAdapter.ts`
- Modify: `src/knowledge-graph/knowledgeGraphService.ts`
- Modify: `src/knowledge-graph/KnowledgeGraphUI.tsx`
- Modify: `src/components/knowledge-graph/KnowledgeGraphModal.tsx`

### Goal

现有知识图谱升级为双图谱展示：LifeGraph + MemoryGraph。

### Acceptance

- 旧日记/阅读/快记/目标/习惯/心情仍显示
- 新 MemoryEntity/MemoryRelation/UserBelief 可显示
- 支持生活星图、认知星图、关系星图切换
- 节点详情显示 confidence/strength/lifecycle/evidence
- 不允许 UI 直接改 Store，所有修改走 feedback service

---

## Task 14: Legacy Migration 旧系统迁移

**Files:**
- Create: `src/memory-body/migration/migrateLegacyMemory.ts`
- Create: `src/memory-body/migration/migrateChatHistory.ts`
- Create: `src/memory-body/migration/migrateKnowledgeGraphSources.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryMigration.test.ts`

### Goal

将旧 MemoryEvent、聊天历史、知识图谱来源数据迁移到 MemoryBody。迁移必须幂等、可回滚、不删除旧数据。

### Acceptance

- 旧 `growth-workbench-memory-state` 可迁移
- 旧 `agent_chat_history` 可迁移
- 旧知识图谱来源 localStorage 可迁移为 LifeGraph atoms/entities
- 重复执行不产生重复 atom
- 损坏数据不会导致页面崩溃

---

## Task 15: ScenarioMemory 场景记忆包

**Files:**
- Create: `src/memory-body/retrieve/scenarioMemorySelector.ts`
- Modify: `src/memory-body/retrieve/memoryContextBuilder.ts`
- Create: `src/memory-body/__tests__/scenarioMemorySelector.test.ts`

### Goal

不同场景调用不同记忆，不让 AI 机械套用无关记忆。

### Scenarios

```text
chat
study
focus
goal_planning
emotional_support
food_recommendation
reflection
knowledge_graph
```

### Acceptance

- 学习场景优先学习节奏、目标、鼓励方式
- 情绪场景优先边界、程序记忆、压力模式
- 饮食场景优先饮食偏好和禁忌
- 目标场景优先长期目标、执行风格、拖延模式

---

## Task 16: Insights + Evaluation 主动洞察与评测

**Files:**
- Create: `src/memory-body/evaluation/memoryDiagnostics.ts`
- Create: `src/memory-body/evaluation/memoryEvaluation.ts`
- Create: `src/memory-body/evaluation/memoryInsightEngine.ts`
- Modify: `src/memory-body/index.ts`
- Create: `src/memory-body/__tests__/memoryEvaluation.test.ts`

### Goal

评估记忆系统是否真的越用越懂用户，并支持低频主动洞察。

### Metrics

```text
Memory Precision
Memory Recall
Context Relevance
Contradiction Rate
User Correction Rate
Personalization Score
Forbidden Leak Count
```

### Acceptance

- diagnostics 输出当前记忆数量、active 数量、forbidden 数量、contradicted 数量
- evaluation 计算 context 命中率
- insight engine 不输出 forbidden/sensitive 明细
- 主动洞察支持关闭

---

## Task 17: 完整回归验证

**Files:**
- No new source files
- Update project memory and handoff

### Required Commands

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

### Browser Verification

```bash
npm run dev
```

验证：

- 首页无白屏
- AI 聊天可打开
- 记忆写入可用
- 记忆中心可打开
- 记忆星图可打开
- Console 无新增 error
- Network 无失败请求
- 移动端宽度 375px 无横向溢出

### Memory Verification Script

手动验证：

```text
1. 输入：我喜欢吃西瓜
2. 输入：我压力大时不要催我
3. 输入：这个 API Key 是 sk-test-secret-123456
4. 输入：你记错了，我不是喜欢西瓜，我只是那天想吃
5. 打开记忆中心
6. 打开记忆星图
```

预期：

- 西瓜记忆写入
- 不要催我写入 boundary/procedural
- API Key 被拦截，不入库
- 西瓜记忆 confidence 降低或进入 correction flow
- 记忆中心可见
- 记忆星图可见

---

## 3. Git 与交付规则

### 3.1 不自动提交

本计划中的所有 Git 提交均为建议。执行者不得擅自 commit 或 push。只有用户明确说“提交”时，才允许提交。

### 3.2 建议分支

如果用户允许创建分支，建议：

```bash
git checkout -b feature/memorybody-cognitive-system
```

如果当前已有未提交改动，不得切分支，除非用户明确确认如何处理现有改动。

### 3.3 建议 commit message

```text
feat(memory-body): add cognitive memory body foundation
feat(memory-body): add safety-first memory ingestion
feat(memory-body): add graph evolution decay retrieval pipeline
feat(memory-body): integrate agent chat memory context
feat(memory-body): add memory center and star map
```

---

## 4. 自检清单

### Spec Coverage

- 分层记忆：Task 1
- 安全过滤：Task 3
- 统一摄取：Task 5
- 抽取器：Task 4
- 认知图谱：Task 6
- 进化巩固：Task 7
- 自然衰减：Task 8
- 上下文检索：Task 9
- Agent 接入：Task 10
- 用户纠错：Task 11
- 记忆中心：Task 12
- 记忆星图：Task 13
- 旧数据迁移：Task 14
- 场景记忆包：Task 15
- 主动洞察与评测：Task 16
- 全量验证：Task 17

### Placeholder Scan

本计划不包含待定实现项。所有模块均有明确文件、职责、验收标准和验证命令。

### Type Consistency

统一使用：

- `MemoryAtom`
- `MemoryEntity`
- `MemoryRelation`
- `UserBelief`
- `MemoryBodyState`
- `MemoryBodyStore`
- `MemoryLifecycle`
- `MemorySensitivity`
- `MemoryScenario`

### Handoff Notes

后续 Agent 接手时必须从 Task 1 开始，不得跳到 AgentChatUI 或 KnowledgeGraphUI 直接改 UI。UI 接入必须等 core/store/safety/ingest/extract/retrieve 至少完成并通过测试。旧系统不得删除。