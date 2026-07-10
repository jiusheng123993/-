# MemoryBody Cognitive Core Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first core slice of the MemoryBody Self-Governing Cognitive Twin by adding auditable memory events, requirement gravity, memory quality scoring, and a prompt context composer that prevents simplified or unsafe memory use.

**Architecture:** Keep `src/memory-body/` as the deep domain module. Add small pure modules for audit, gravity, quality, and prompt composition, then adapt `AgentChatMemoryAdapter` to call the composer without changing UI contracts. All new behavior is test-first and avoids writing secrets or sensitive raw values into audit output.

**Tech Stack:** TypeScript + Vitest + existing MemoryBody core/store/retrieval/context modules + existing AgentChatMemoryAdapter.

---

## 0. Scope and Constraints

This plan implements only Phase 1: Cognitive Core Foundation from `docs/superpowers/specs/2026-06-23-memorybody-self-governing-cognitive-twin-design.md`.

It intentionally does not implement Memory Center UI, MemoryStarMap, cloud sync, embeddings, or CognitiveTimeMachine yet.

Before each task:

```bash
git status --short --branch
```

After each task:

```bash
npx vitest run <changed-test-file>
npx tsc --noEmit
npm run lint
```

Before final handoff:

```bash
npm test
npm run build
git diff --check
```

---

## 1. File Structure

Create:

```text
src/memory-body/audit/memoryAuditLog.ts
src/memory-body/gravity/requirementGravity.ts
src/memory-body/quality/memoryQuality.ts
src/memory-body/context/promptContextComposer.ts
src/memory-body/__tests__/memoryAuditLog.test.ts
src/memory-body/__tests__/requirementGravity.test.ts
src/memory-body/__tests__/memoryQuality.test.ts
src/memory-body/__tests__/promptContextComposer.test.ts
```

Modify:

```text
src/memory-body/adapter/agentChatMemoryAdapter.ts
src/memory-body/index.ts
src/memory-body/__tests__/agentChatMemoryAdapter.test.ts
```

Responsibilities:

- `memoryAuditLog.ts`: pure audit event creation and safe redaction for memory operations.
- `requirementGravity.ts`: classify user statements into gravity levels such as casual preference, product principle, engineering principle, correction signal, and trust-critical signal.
- `memoryQuality.ts`: score a MemoryAtom for usefulness, evidence, stability, sensitivity risk, and review need.
- `promptContextComposer.ts`: central prompt memory composer that filters forbidden/unsafe items, ranks by relevance and quality, and exposes a short explanation of why memory was used.
- `agentChatMemoryAdapter.ts`: keep public API stable while delegating prompt context construction to the composer.

---

## 2. Tasks

### Task 1: MemoryAuditLog Pure Module

**Files:**
- Create: `src/memory-body/audit/memoryAuditLog.ts`
- Create: `src/memory-body/__tests__/memoryAuditLog.test.ts`
- Modify: `src/memory-body/index.ts`

- [ ] **Step 1: Write failing tests**

Create `src/memory-body/__tests__/memoryAuditLog.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { createMemoryAuditEvent, redactAuditText } from '../audit/memoryAuditLog'

describe('memoryAuditLog', () => {
  it('creates an audit event for memory confirmation without changing the input text', () => {
    const event = createMemoryAuditEvent({
      id: 'audit-1',
      type: 'memory_confirmed',
      atomId: 'atom-1',
      timestamp: '2026-06-23T00:00:00.000Z',
      actor: 'user',
      summary: '用户确认完整方案偏好',
      sourceText: '确认这条记忆，没错'
    })

    expect(event).toEqual({
      id: 'audit-1',
      type: 'memory_confirmed',
      atomId: 'atom-1',
      timestamp: '2026-06-23T00:00:00.000Z',
      actor: 'user',
      summary: '用户确认完整方案偏好',
      safeSourceText: '确认这条记忆，没错'
    })
  })

  it('redacts secret-like text from audit source text', () => {
    expect(redactAuditText('我的 token 是 sk-1234567890abcdef')).toBe('我的 token 是 [REDACTED_SECRET]')
    expect(redactAuditText('password=hello-world')).toBe('password=[REDACTED_SECRET]')
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx vitest run src/memory-body/__tests__/memoryAuditLog.test.ts
```

Expected: FAIL because `../audit/memoryAuditLog` does not exist.

- [ ] **Step 3: Implement module**

Create `src/memory-body/audit/memoryAuditLog.ts`:

```typescript
export type MemoryAuditEventType =
  | 'memory_created'
  | 'memory_confirmed'
  | 'memory_corrected'
  | 'memory_forgotten'
  | 'memory_protected'
  | 'memory_restored'
  | 'memory_archived'
  | 'memory_used_in_prompt'
  | 'cognitive_profile_updated'
  | 'trust_repair_triggered'
  | 'policy_blocked_memory'
  | 'migration_completed'

export type MemoryAuditActor = 'user' | 'assistant' | 'system'

export interface MemoryAuditEventInput {
  id: string
  type: MemoryAuditEventType
  atomId?: string
  timestamp: string
  actor: MemoryAuditActor
  summary: string
  sourceText?: string
}

export interface MemoryAuditEvent {
  id: string
  type: MemoryAuditEventType
  atomId?: string
  timestamp: string
  actor: MemoryAuditActor
  summary: string
  safeSourceText?: string
}

const secretPatterns = [
  /sk-[a-zA-Z0-9_-]{8,}/g,
  /(token\s*[=:：]\s*)[^\s，。；;]+/gi,
  /(password\s*[=:：]\s*)[^\s，。；;]+/gi,
  /(api[_-]?key\s*[=:：]\s*)[^\s，。；;]+/gi
]

export function redactAuditText(text: string): string {
  return secretPatterns.reduce((safeText, pattern) => safeText.replace(pattern, match => {
    const prefixMatch = match.match(/^(token\s*[=:：]\s*|password\s*[=:：]\s*|api[_-]?key\s*[=:：]\s*)/i)
    return prefixMatch ? `${prefixMatch[1]}[REDACTED_SECRET]` : '[REDACTED_SECRET]'
  }), text)
}

export function createMemoryAuditEvent(input: MemoryAuditEventInput): MemoryAuditEvent {
  return {
    id: input.id,
    type: input.type,
    atomId: input.atomId,
    timestamp: input.timestamp,
    actor: input.actor,
    summary: input.summary,
    safeSourceText: input.sourceText ? redactAuditText(input.sourceText) : undefined
  }
}
```

- [ ] **Step 4: Export module**

Add to `src/memory-body/index.ts`:

```typescript
export * from './audit/memoryAuditLog'
```

- [ ] **Step 5: Run test to verify GREEN**

Run:

```bash
npx vitest run src/memory-body/__tests__/memoryAuditLog.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run checks**

Run:

```bash
npx tsc --noEmit
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/memory-body/audit/memoryAuditLog.ts src/memory-body/__tests__/memoryAuditLog.test.ts src/memory-body/index.ts
git commit -m "feat(memorybody): add safe memory audit events"
```

---

### Task 2: RequirementGravity Scoring

**Files:**
- Create: `src/memory-body/gravity/requirementGravity.ts`
- Create: `src/memory-body/__tests__/requirementGravity.test.ts`
- Modify: `src/memory-body/index.ts`

- [ ] **Step 1: Write failing tests**

Create `src/memory-body/__tests__/requirementGravity.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { classifyRequirementGravity } from '../gravity/requirementGravity'

describe('requirementGravity', () => {
  it('classifies complete-plan corrections as product principles and correction signals', () => {
    expect(classifyRequirementGravity('我说错了，是要做就做最完整的方案')).toEqual({
      level: 'product_principle',
      score: 0.95,
      signals: ['correction_signal', 'complete_solution']
    })
  })

  it('classifies engineering process requirements as engineering principles', () => {
    expect(classifyRequirementGravity('修改也要按照项目规则，必须测试验证')).toEqual({
      level: 'engineering_principle',
      score: 0.9,
      signals: ['project_rule', 'verification_required']
    })
  })

  it('classifies simple food preference as casual preference', () => {
    expect(classifyRequirementGravity('我喜欢吃西瓜')).toEqual({
      level: 'casual_preference',
      score: 0.4,
      signals: ['preference']
    })
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx vitest run src/memory-body/__tests__/requirementGravity.test.ts
```

Expected: FAIL because `../gravity/requirementGravity` does not exist.

- [ ] **Step 3: Implement module**

Create `src/memory-body/gravity/requirementGravity.ts`:

```typescript
export type RequirementGravityLevel =
  | 'casual_preference'
  | 'repeated_preference'
  | 'hard_boundary'
  | 'product_principle'
  | 'engineering_principle'
  | 'trust_critical_signal'

export type RequirementGravitySignal =
  | 'preference'
  | 'complete_solution'
  | 'correction_signal'
  | 'project_rule'
  | 'verification_required'
  | 'trust_repair'
  | 'hard_boundary'

export interface RequirementGravityResult {
  level: RequirementGravityLevel
  score: number
  signals: RequirementGravitySignal[]
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword))
}

export function classifyRequirementGravity(input: string): RequirementGravityResult {
  const text = input.trim()
  const signals: RequirementGravitySignal[] = []

  if (includesAny(text, ['我说错了', '不是', '纠正', '应该是'])) signals.push('correction_signal')
  if (includesAny(text, ['完整方案', '完全体', '最完整', '不要简化', '不是简化'])) signals.push('complete_solution')
  if (includesAny(text, ['项目规则', '全局规则', '按照规则'])) signals.push('project_rule')
  if (includesAny(text, ['测试验证', '验证', '构建', 'lint', 'typecheck'])) signals.push('verification_required')
  if (includesAny(text, ['又忘了', '理解错了', '为什么没修改', '不够完善'])) signals.push('trust_repair')
  if (includesAny(text, ['必须', '禁止', '不要', '不允许'])) signals.push('hard_boundary')
  if (includesAny(text, ['喜欢', '偏好'])) signals.push('preference')

  if (signals.includes('correction_signal') && signals.includes('complete_solution')) {
    return { level: 'product_principle', score: 0.95, signals: ['correction_signal', 'complete_solution'] }
  }

  if (signals.includes('project_rule') || signals.includes('verification_required')) {
    return {
      level: 'engineering_principle',
      score: 0.9,
      signals: signals.filter(signal => signal === 'project_rule' || signal === 'verification_required')
    }
  }

  if (signals.includes('trust_repair')) return { level: 'trust_critical_signal', score: 0.88, signals: ['trust_repair'] }
  if (signals.includes('hard_boundary')) return { level: 'hard_boundary', score: 0.82, signals: ['hard_boundary'] }
  if (signals.includes('preference')) return { level: 'casual_preference', score: 0.4, signals: ['preference'] }
  return { level: 'casual_preference', score: 0.2, signals: [] }
}
```

- [ ] **Step 4: Export module**

Add to `src/memory-body/index.ts`:

```typescript
export * from './gravity/requirementGravity'
```

- [ ] **Step 5: Run test to verify GREEN**

Run:

```bash
npx vitest run src/memory-body/__tests__/requirementGravity.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run checks and commit**

Run:

```bash
npx tsc --noEmit
npm run lint
git add src/memory-body/gravity/requirementGravity.ts src/memory-body/__tests__/requirementGravity.test.ts src/memory-body/index.ts
git commit -m "feat(memorybody): classify requirement gravity"
```

---

### Task 3: MemoryQuality Scoring

**Files:**
- Create: `src/memory-body/quality/memoryQuality.ts`
- Create: `src/memory-body/__tests__/memoryQuality.test.ts`
- Modify: `src/memory-body/index.ts`

- [ ] **Step 1: Write failing tests**

Create `src/memory-body/__tests__/memoryQuality.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'

const baseAtom: MemoryAtom = {
  id: 'atom-1',
  scope: { userId: 'user-1', projectId: 'project-1' },
  layer: 'semantic',
  type: 'preference',
  subject: 'user',
  predicate: 'prefers',
  object: '完整方案',
  content: '用户偏好完整方案，不接受简化版',
  source: 'chat',
  confidence: 0.8,
  strength: 0.8,
  emotionalWeight: 0.3,
  sensitivity: 'personal',
  lifecycle: 'confirmed',
  evidence: [{
    id: 'evidence-1',
    source: 'chat',
    sourceText: '要做就做最完整的方案',
    timestamp: '2026-06-23T00:00:00.000Z',
    confidence: 0.9
  }],
  tags: ['complete-solution'],
  scenarios: ['chat', 'goal_planning'],
  createdAt: '2026-06-23T00:00:00.000Z',
  updatedAt: '2026-06-23T00:00:00.000Z',
  lastAccessedAt: '2026-06-23T00:00:00.000Z',
  accessCount: 3,
  contradictionOf: []
}

describe('memoryQuality', () => {
  it('scores confirmed high-evidence memory as high value and low review need', () => {
    expect(scoreMemoryQuality(baseAtom)).toEqual({
      valueScore: 0.86,
      evidenceScore: 0.9,
      stabilityScore: 0.85,
      riskScore: 0.35,
      reviewNeed: 0.1,
      overallScore: 0.77
    })
  })

  it('raises risk and review need for sensitive draft memory', () => {
    expect(scoreMemoryQuality({
      ...baseAtom,
      id: 'atom-sensitive',
      lifecycle: 'draft',
      sensitivity: 'sensitive',
      evidence: []
    })).toEqual({
      valueScore: 0.68,
      evidenceScore: 0,
      stabilityScore: 0.25,
      riskScore: 0.8,
      reviewNeed: 0.9,
      overallScore: 0.2
    })
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx vitest run src/memory-body/__tests__/memoryQuality.test.ts
```

Expected: FAIL because `../quality/memoryQuality` does not exist.

- [ ] **Step 3: Implement module**

Create `src/memory-body/quality/memoryQuality.ts`:

```typescript
import type { MemoryAtom } from '../core/memoryBodyTypes'

export interface MemoryQualityScore {
  valueScore: number
  evidenceScore: number
  stabilityScore: number
  riskScore: number
  reviewNeed: number
  overallScore: number
}

function roundScore(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100
}

function sensitivityRisk(atom: MemoryAtom): number {
  if (atom.sensitivity === 'forbidden') return 1
  if (atom.sensitivity === 'private') return 0.9
  if (atom.sensitivity === 'sensitive') return 0.8
  if (atom.sensitivity === 'personal') return 0.35
  return 0.15
}

function lifecycleStability(atom: MemoryAtom): number {
  if (atom.lifecycle === 'stable' || atom.lifecycle === 'protected') return 0.95
  if (atom.lifecycle === 'confirmed') return 0.85
  if (atom.lifecycle === 'active') return 0.6
  if (atom.lifecycle === 'draft') return 0.25
  if (atom.lifecycle === 'weakening') return 0.35
  return 0.1
}

export function scoreMemoryQuality(atom: MemoryAtom): MemoryQualityScore {
  const evidenceScore = roundScore(atom.evidence.length === 0 ? 0 : atom.evidence.reduce((sum, evidence) => sum + evidence.confidence, 0) / atom.evidence.length)
  const stabilityScore = lifecycleStability(atom)
  const riskScore = sensitivityRisk(atom)
  const valueScore = roundScore((atom.confidence * 0.35) + (atom.strength * 0.35) + (Math.min(atom.accessCount, 5) / 5 * 0.2) + (atom.scenarios?.length ? 0.1 : 0))
  const reviewNeed = roundScore((atom.lifecycle === 'draft' ? 0.45 : 0.05) + (evidenceScore < 0.4 ? 0.25 : 0) + (riskScore >= 0.8 ? 0.2 : 0))
  const overallScore = roundScore((valueScore * 0.35) + (evidenceScore * 0.25) + (stabilityScore * 0.25) - (riskScore * 0.15))

  return {
    valueScore,
    evidenceScore,
    stabilityScore,
    riskScore,
    reviewNeed,
    overallScore
  }
}
```

- [ ] **Step 4: Export module**

Add to `src/memory-body/index.ts`:

```typescript
export * from './quality/memoryQuality'
```

- [ ] **Step 5: Run test to verify GREEN**

Run:

```bash
npx vitest run src/memory-body/__tests__/memoryQuality.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run checks and commit**

Run:

```bash
npx tsc --noEmit
npm run lint
git add src/memory-body/quality/memoryQuality.ts src/memory-body/__tests__/memoryQuality.test.ts src/memory-body/index.ts
git commit -m "feat(memorybody): score memory quality"
```

---

### Task 4: PromptContextComposer

**Files:**
- Create: `src/memory-body/context/promptContextComposer.ts`
- Create: `src/memory-body/__tests__/promptContextComposer.test.ts`
- Modify: `src/memory-body/index.ts`

- [ ] **Step 1: Write failing tests**

Create `src/memory-body/__tests__/promptContextComposer.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { composePromptContext } from '../context/promptContextComposer'

function atom(partial: Partial<MemoryAtom>): MemoryAtom {
  return {
    id: partial.id ?? 'atom-1',
    scope: { userId: 'user-1', projectId: 'project-1' },
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'prefers',
    object: partial.object ?? '完整方案',
    content: partial.content ?? '用户偏好完整方案，不接受简化版',
    source: 'chat',
    confidence: partial.confidence ?? 0.9,
    strength: partial.strength ?? 0.9,
    emotionalWeight: 0.2,
    sensitivity: partial.sensitivity ?? 'personal',
    lifecycle: partial.lifecycle ?? 'confirmed',
    evidence: partial.evidence ?? [],
    tags: partial.tags ?? [],
    scenarios: partial.scenarios ?? ['chat'],
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
    lastAccessedAt: '2026-06-23T00:00:00.000Z',
    accessCount: partial.accessCount ?? 1,
    contradictionOf: []
  }
}

describe('promptContextComposer', () => {
  it('composes safe memory context with usage explanation', () => {
    const result = composePromptContext({
      atoms: [atom({ id: 'atom-complete' })],
      maxItems: 3
    })

    expect(result.context).toContain('用户偏好完整方案，不接受简化版')
    expect(result.usedAtomIds).toEqual(['atom-complete'])
    expect(result.explanations).toEqual(['使用 atom-complete：confirmed / personal / overall 0.79'])
  })

  it('excludes forbidden and archived memories', () => {
    const result = composePromptContext({
      atoms: [
        atom({ id: 'atom-active', content: '用户偏好完整方案' }),
        atom({ id: 'atom-forbidden', content: '用户喜欢西瓜', lifecycle: 'forbidden', sensitivity: 'forbidden' }),
        atom({ id: 'atom-archived', content: '旧偏好', lifecycle: 'archived' })
      ],
      maxItems: 5
    })

    expect(result.context).toContain('用户偏好完整方案')
    expect(result.context).not.toContain('用户喜欢西瓜')
    expect(result.context).not.toContain('旧偏好')
    expect(result.usedAtomIds).toEqual(['atom-active'])
  })
})
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npx vitest run src/memory-body/__tests__/promptContextComposer.test.ts
```

Expected: FAIL because `../context/promptContextComposer` does not exist.

- [ ] **Step 3: Implement module**

Create `src/memory-body/context/promptContextComposer.ts`:

```typescript
import { buildMemoryBodyPromptContext } from './memoryBodyContextBuilder'
import { isActiveMemoryAtom, isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'

export interface PromptContextComposerInput {
  atoms: MemoryAtom[]
  maxItems?: number
}

export interface PromptContextComposerResult {
  context: string
  usedAtomIds: string[]
  explanations: string[]
}

export function composePromptContext(input: PromptContextComposerInput): PromptContextComposerResult {
  const ranked = input.atoms
    .filter(atom => isActiveMemoryAtom(atom) && !isForbiddenMemoryAtom(atom))
    .map(atom => ({ atom, quality: scoreMemoryQuality(atom) }))
    .sort((left, right) => right.quality.overallScore - left.quality.overallScore)
    .slice(0, input.maxItems ?? 8)

  const atoms = ranked.map(item => item.atom)

  return {
    context: buildMemoryBodyPromptContext({ atoms }),
    usedAtomIds: atoms.map(atom => atom.id),
    explanations: ranked.map(item => `使用 ${item.atom.id}：${item.atom.lifecycle} / ${item.atom.sensitivity} / overall ${item.quality.overallScore.toFixed(2)}`)
  }
}
```

- [ ] **Step 4: Export module**

Add to `src/memory-body/index.ts`:

```typescript
export * from './context/promptContextComposer'
```

- [ ] **Step 5: Run test to verify GREEN**

Run:

```bash
npx vitest run src/memory-body/__tests__/promptContextComposer.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run checks and commit**

Run:

```bash
npx tsc --noEmit
npm run lint
git add src/memory-body/context/promptContextComposer.ts src/memory-body/__tests__/promptContextComposer.test.ts src/memory-body/index.ts
git commit -m "feat(memorybody): compose governed prompt context"
```

---

### Task 5: AgentChatMemoryAdapter Integration

**Files:**
- Modify: `src/memory-body/adapter/agentChatMemoryAdapter.ts`
- Modify: `src/memory-body/__tests__/agentChatMemoryAdapter.test.ts`

- [ ] **Step 1: Add regression test**

Append to `src/memory-body/__tests__/agentChatMemoryAdapter.test.ts`:

```typescript
it('builds prompt context through governed composer and excludes forbidden memories', () => {
  const store = createInMemoryMemoryBodyStore(scope.userId, scope.projectId)
  store.upsertAtom(createAtom({
    id: 'atom-complete-solution',
    object: '完整方案',
    content: '用户偏好完整方案，不接受简化版',
    lifecycle: 'confirmed',
    confidence: 0.9,
    strength: 0.9
  }))
  store.upsertAtom(createAtom({
    id: 'atom-forbidden-watermelon',
    object: '西瓜',
    content: '用户喜欢西瓜',
    lifecycle: 'forbidden',
    sensitivity: 'forbidden'
  }))
  const adapter = createAgentChatMemoryAdapter({ store, scope })

  const context = adapter.buildPromptContext('继续完整方案')

  expect(context).toContain('用户偏好完整方案，不接受简化版')
  expect(context).not.toContain('用户喜欢西瓜')
})
```

- [ ] **Step 2: Run test**

Run:

```bash
npx vitest run src/memory-body/__tests__/agentChatMemoryAdapter.test.ts
```

Expected: PASS currently for forbidden filtering; after implementation still PASS.

- [ ] **Step 3: Modify adapter to use composer**

In `src/memory-body/adapter/agentChatMemoryAdapter.ts`, replace the import:

```typescript
import { buildMemoryBodyPromptContext } from '../context/memoryBodyContextBuilder'
```

with:

```typescript
import { composePromptContext } from '../context/promptContextComposer'
```

Then replace:

```typescript
const context = buildMemoryBodyPromptContext({ atoms })
```

with:

```typescript
const { context } = composePromptContext({ atoms })
```

- [ ] **Step 4: Run related tests**

Run:

```bash
npx vitest run src/memory-body/__tests__/agentChatMemoryAdapter.test.ts src/memory-body/__tests__/promptContextComposer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run checks and commit**

Run:

```bash
npx tsc --noEmit
npm run lint
git add src/memory-body/adapter/agentChatMemoryAdapter.ts src/memory-body/__tests__/agentChatMemoryAdapter.test.ts
git commit -m "feat(memorybody): route chat context through composer"
```

---

## 3. Final Verification

After all tasks:

```bash
npx vitest run src/memory-body/__tests__/memoryAuditLog.test.ts src/memory-body/__tests__/requirementGravity.test.ts src/memory-body/__tests__/memoryQuality.test.ts src/memory-body/__tests__/promptContextComposer.test.ts src/memory-body/__tests__/agentChatMemoryAdapter.test.ts
npx tsc --noEmit
npm run lint
npm test
npm run build
git diff --check
```

Expected: all pass. Existing jsdom canvas warnings are acceptable if assertions pass.

Then run:

```bash
codegraph sync
```

Commit any remaining plan-only changes if not already committed:

```bash
git add docs/superpowers/plans/2026-06-23-memorybody-cognitive-core-foundation.md
git commit -m "docs(memorybody): plan cognitive core foundation"
```

---

## 4. Self-Review

Spec coverage:

- MemoryAuditLog: Task 1.
- RequirementGravity: Task 2.
- MemoryQuality: Task 3.
- PromptContextComposer: Task 4.
- AgentChat integration: Task 5.
- Safety: Tasks 1 and 4 redact secrets and filter forbidden memory.
- Regression against simplification: Task 2 and Task 5 introduce complete-solution behavior as high-gravity and prompt-preserved.

Known future gaps intentionally out of scope:

- Memory Center UI.
- Review Queue UI.
- ReflectionEngine.
- ExplainabilityEngine UI.
- MemoryStarMap.
- Semantic embeddings.
- Cloud sync.
