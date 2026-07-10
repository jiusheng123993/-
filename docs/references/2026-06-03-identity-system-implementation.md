# Identity System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the identity system with free-form description, tag selection, and confirmation flow, replacing the old persona selection with a modern multi-step identity creation UI.

**Architecture:** Extend the existing `src/identity/` module with a complete multi-step selector UI. The identity system stores user-created identities with tags, name, and description. Data persists via the existing `identityStore.ts` (localStorage-backed). The UI follows the project's existing React + CSS patterns without external UI libraries.

**Tech Stack:** React 18, TypeScript, Vitest, existing project CSS variables

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/identity/types.ts` | Type definitions for Identity, IdentityTag, IdentityState, IdentityAction |
| `src/identity/identityStore.ts` | localStorage-backed persistence for identity state |
| `src/identity/IdentityProvider.tsx` | React Context + useReducer for identity state management |
| `src/identity/IdentitySelector.tsx` | Multi-step UI: describe → tags → confirm |
| `src/identity/IdentitySelector.test.tsx` | Unit tests for the selector component |

---

## Task 1: Complete the IdentitySelector Component

**Files:**
- Modify: `src/identity/IdentitySelector.tsx`
- Test: `src/identity/IdentitySelector.test.tsx`

The existing `IdentitySelector.tsx` only has the skeleton (imports, state hooks, `toggleTag`). Complete it with a full three-step flow.

- [ ] **Step 1: Write the failing test**

```tsx
// src/identity/IdentitySelector.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IdentityProvider } from './IdentityProvider'
import { IdentitySelector } from './IdentitySelector'

describe('IdentitySelector', () => {
  it('renders step 1 (describe) by default', () => {
    render(
      <IdentityProvider>
        <IdentitySelector />
      </IdentityProvider>
    )
    expect(screen.getByPlaceholderText(/描述一下你的身份/)).toBeInTheDocument()
  })

  it('advances to step 2 (tags) when description is provided and next is clicked', () => {
    render(
      <IdentityProvider>
        <IdentitySelector />
      </IdentityProvider>
    )
    fireEvent.change(screen.getByPlaceholderText(/描述一下你的身份/), {
      target: { value: '我是一名大学生' }
    })
    fireEvent.click(screen.getByText(/下一步/))
    expect(screen.getByText(/选择标签/)).toBeInTheDocument()
  })

  it('creates identity on confirm', () => {
    render(
      <IdentityProvider>
        <IdentitySelector />
      </IdentityProvider>
    )
    // Step 1
    fireEvent.change(screen.getByPlaceholderText(/描述一下你的身份/), {
      target: { value: '我是一名大学生' }
    })
    fireEvent.click(screen.getByText(/下一步/))
    // Step 2 - select a tag
    fireEvent.click(screen.getByText('学生'))
    fireEvent.click(screen.getByText(/下一步/))
    // Step 3 - confirm
    fireEvent.click(screen.getByText(/确认创建/))
    // After creation, should show identity list or creation form again
    expect(screen.getByText(/身份创建成功/)).toBeInTheDocument()
  })
})
```

Run: `npm run test -- src/identity/IdentitySelector.test.tsx`
Expected: FAIL - component not fully implemented

- [ ] **Step 2: Implement the complete IdentitySelector component**

Replace the content of `src/identity/IdentitySelector.tsx` with:

```tsx
import { useState } from 'react'
import { useIdentity } from './IdentityProvider'
import type { IdentityTag } from './types'

const availableTags: { value: IdentityTag; label: string }[] = [
  { value: 'student', label: '学生' },
  { value: 'worker', label: '打工人' },
  { value: 'parent', label: '宝妈/宝爸' },
  { value: 'creator', label: '创作者' },
  { value: 'freelancer', label: '自由职业' },
  { value: 'entrepreneur', label: '创业者' },
  { value: 'retiree', label: '退休' },
  { value: 'other', label: '其他' }
]

export const IdentitySelector: React.FC = () => {
  const { state, dispatch } = useIdentity()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<IdentityTag[]>([])
  const [step, setStep] = useState<'describe' | 'tags' | 'confirm'>('describe')
  const [created, setCreated] = useState(false)

  const toggleTag = (tag: IdentityTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleCreate = () => {
    dispatch({
      type: 'CREATE_IDENTITY',
      payload: {
        name: name.trim() || '未命名身份',
        description: description.trim(),
        tags: selectedTags
      }
    })
    setCreated(true)
    setName('')
    setDescription('')
    setSelectedTags([])
    setStep('describe')
  }

  const handleReset = () => {
    setCreated(false)
    setStep('describe')
  }

  if (created) {
    return (
      <div className="identity-selector" data-testid="identity-success">
        <div className="identity-success">
          <h2>身份创建成功</h2>
          <p>您的新身份已保存，可以在侧边栏中切换。</p>
          <button onClick={handleReset} className="identity-btn-primary">
            创建另一个身份
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="identity-selector" data-testid="identity-selector">
      {/* Progress indicator */}
      <div className="identity-progress">
        {['describe', 'tags', 'confirm'].map((s, idx) => (
          <div
            key={s}
            className={`identity-progress-step ${step === s ? 'active' : ''} ${
              ['describe', 'tags', 'confirm'].indexOf(step) > idx ? 'completed' : ''
            }`}
          >
            <span className="identity-progress-dot">{idx + 1}</span>
            <span className="identity-progress-label">
              {s === 'describe' ? '描述身份' : s === 'tags' ? '选择标签' : '确认创建'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Describe */}
      {step === 'describe' && (
        <div className="identity-step" data-testid="step-describe">
          <h2>描述你的身份</h2>
          <p className="identity-hint">用一句话描述你是谁，想做什么</p>
          <input
            type="text"
            placeholder="例如：我是一名备考研究生的大学生"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="identity-input"
          />
          <div className="identity-step-actions">
            <button
              onClick={() => setStep('tags')}
              disabled={!description.trim()}
              className="identity-btn-primary"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Tags */}
      {step === 'tags' && (
        <div className="identity-step" data-testid="step-tags">
          <h2>选择标签</h2>
          <p className="identity-hint">选择最符合你身份的标签（可多选）</p>
          <div className="identity-tag-grid">
            {availableTags.map(tag => (
              <button
                key={tag.value}
                onClick={() => toggleTag(tag.value)}
                className={`identity-tag ${selectedTags.includes(tag.value) ? 'selected' : ''}`}
                type="button"
              >
                {tag.label}
              </button>
            ))}
          </div>
          <div className="identity-step-actions">
            <button onClick={() => setStep('describe')} className="identity-btn-secondary">
              上一步
            </button>
            <button onClick={() => setStep('confirm')} className="identity-btn-primary">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="identity-step" data-testid="step-confirm">
          <h2>确认创建</h2>
          <div className="identity-summary">
            <div className="identity-summary-item">
              <span className="identity-summary-label">描述</span>
              <span className="identity-summary-value">{description}</span>
            </div>
            <div className="identity-summary-item">
              <span className="identity-summary-label">标签</span>
              <span className="identity-summary-value">
                {selectedTags.length > 0
                  ? selectedTags
                      .map(t => availableTags.find(tag => tag.value === t)?.label)
                      .join('、')
                  : '未选择'}
              </span>
            </div>
          </div>
          <div className="identity-step-actions">
            <button onClick={() => setStep('tags')} className="identity-btn-secondary">
              上一步
            </button>
            <button onClick={handleCreate} className="identity-btn-primary">
              确认创建
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run tests to verify**

Run: `npm run test -- src/identity/IdentitySelector.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/identity/IdentitySelector.tsx src/identity/IdentitySelector.test.tsx
git commit -m "feat(identity): implement multi-step identity selector UI"
```

---

## Task 2: Add CSS Styles for Identity Selector

**Files:**
- Create: `src/identity/IdentitySelector.css`
- Modify: `src/identity/IdentitySelector.tsx` (add import)

- [ ] **Step 1: Create CSS file**

Create `src/identity/IdentitySelector.css`:

```css
.identity-selector {
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: inherit;
}

/* Progress indicator */
.identity-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.identity-progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 200ms ease;
}

.identity-progress-step.active {
  opacity: 1;
}

.identity-progress-step.completed {
  opacity: 0.7;
}

.identity-progress-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.identity-progress-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

/* Step content */
.identity-step {
  animation: identityFadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes identityFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.identity-step h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.identity-hint {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.6;
}

/* Input */
.identity-input {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease;
  box-sizing: border-box;
}

.identity-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

/* Tag grid */
.identity-tag-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.identity-tag {
  padding: 14px 18px;
  border-radius: 14px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.identity-tag:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.identity-tag.selected {
  border-color: var(--primary);
  background: var(--primary);
  color: #fff;
}

/* Summary */
.identity-summary {
  background: var(--surface);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid var(--border);
}

.identity-summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.identity-summary-item:last-child {
  border-bottom: none;
}

.identity-summary-label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.identity-summary-value {
  font-size: 15px;
  color: var(--text);
  font-weight: 500;
  line-height: 1.5;
}

/* Actions */
.identity-step-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.identity-btn-primary {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.identity-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.identity-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.identity-btn-secondary {
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.identity-btn-secondary:hover {
  background: var(--surface);
}

/* Success state */
.identity-success {
  text-align: center;
  padding: 48px 24px;
}

.identity-success h2 {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.identity-success p {
  margin: 0 0 24px;
  font-size: 15px;
  color: var(--muted);
}
```

- [ ] **Step 2: Import CSS in the component**

Add to the top of `src/identity/IdentitySelector.tsx`:
```tsx
import './IdentitySelector.css'
```

- [ ] **Step 3: Run lint to verify**

Run: `npm run lint -- src/identity/IdentitySelector.tsx`
Expected: PASS (or only existing warnings)

- [ ] **Step 4: Commit**

```bash
git add src/identity/IdentitySelector.css src/identity/IdentitySelector.tsx
git commit -m "feat(identity): add styles for identity selector"
```

---

## Task 3: Integrate IdentitySelector into the App

**Files:**
- Modify: `src/App.tsx`

The `IdentitySelector` needs to be accessible from the app. For now, add it as a route or modal trigger within the existing IdentityProvider.

- [ ] **Step 1: Add a route/entry point for IdentitySelector**

In `src/App.tsx`, find where `IdentityProvider` wraps the app (it's already there at line 725). We need to add a way to open the identity selector. For this iteration, add a simple state-driven modal:

Add near the top of App component (around line 232 where other state is declared):
```tsx
const [isIdentitySelectorOpen, setIsIdentitySelectorOpen] = useState(false)
```

Add an import at the top:
```tsx
import { IdentitySelector } from './identity/IdentitySelector'
```

Add a button in the sidebar or hero section to open the selector. For simplicity, add it in the hero actions section (around line 791, inside the `.hero-actions` div):

```tsx
<button 
  className="pill" 
  onClick={() => setIsIdentitySelectorOpen(true)}
  type="button"
>
  创建身份
</button>
```

Add the modal markup before the closing `</main>` tag (around line 2346, before `</IdentityProvider>`):

```tsx
{isIdentitySelectorOpen && (
  <div 
    className="identity-modal-backdrop" 
    onClick={() => setIsIdentitySelectorOpen(false)}
    role="presentation"
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <div 
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--app-background)',
        borderRadius: '24px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <IdentitySelector />
    </div>
  </div>
)}
```

- [ ] **Step 2: Run tests**

Run: `npm run test`
Expected: All 881 tests pass (or the new tests pass and no regressions)

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(identity): integrate IdentitySelector into App with modal"
```

---

## Task 4: Run Full Verification

- [ ] **Step 1: Run lint**

```bash
npm run lint
```
Expected: PASS (or only the 1 existing warning)

- [ ] **Step 2: Run typecheck**

```bash
npm run build
```
Expected: PASS (TypeScript compilation succeeds)

- [ ] **Step 3: Run all tests**

```bash
npm run test
```
Expected: All tests pass

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(identity): complete identity system selector implementation"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| 用户可以通过自由描述创建身份 | Task 1 - Step 2 (describe step) |
| 用户可以通过标签组合快速选择身份 | Task 1 - Step 2 (tags step) |
| 不同身份显示不同的默认模块 | Future work - module system |
| 模块可以自由添加/删除/排序 | Future work - module store |
| 画布支持拖拽布局 | Future work - draggable canvas |
| 动画流畅，符合鸿蒙风格 | Task 2 - CSS animations with cubic-bezier(0.4, 0, 0.2, 1) |
| 布局自动保存 | Already in identityStore.ts |
| 侧边栏可以正常展开/收起 | Already implemented in Sidebar.tsx |

---

## Placeholder Scan

- No "TBD", "TODO", "implement later", "fill in details" found.
- All steps contain actual code.
- All file paths are exact.
- Type consistency verified across tasks.
