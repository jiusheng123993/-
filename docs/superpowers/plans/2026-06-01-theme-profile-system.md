# Theme Profile System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing theme registry into a user-centered Theme Profile system with 8 research-backed official themes and compatibility with the current UI.

**Architecture:** This first module only changes the theme layer and its tests. It keeps the existing React UI contract stable by preserving the exported `themeRegistry`, `getThemeById`, and token shape while adding richer theme metadata for aesthetics, accessibility, recommended users, wallpaper compatibility, and user-facing descriptions.

**Tech Stack:** React, TypeScript, Vite, Vitest, existing CSS variable theme application.

---

## Scope

This plan implements the first module from the new product specification: the Theme Profile system. It does not implement wallpaper upload, Persona homepage restructuring, female cycle management, or AI. Those are subsequent independent modules.

## Files

- Modify: `src/themes/themeRegistry.ts`
  - Rename theme concept internally from study-only thinking to profile-based app themes.
  - Add 8 official theme IDs.
  - Add metadata fields without breaking existing token access.
- Modify: `src/themes/themeRegistry.test.ts`
  - Add tests for 8 themes, metadata completeness, fallback behavior, and contrast-related token presence.
- Modify: `src/App.test.tsx`
  - Update expectations if current theme names change in rendered UI.
- Modify: `src/App.tsx`
  - Only if TypeScript requires updated imports or UI labels.
- Modify: `src/styles.css`
  - Only if the current CSS variables need small compatibility adjustments.

## Commands

Use commands confirmed from `package.json`:

```bash
npm test
npm run lint
npm run build
```

For browser verification after implementation:

```bash
npm run dev
```

Then open the Vite local URL and check no white screen, no Console error, and no failed Network request.

---

### Task 1: Extend theme registry tests first

**Files:**
- Modify: `src/themes/themeRegistry.test.ts`

- [ ] **Step 1: Replace the theme registry tests with metadata-focused expectations**

Use this test structure:

```ts
import { describe, expect, it } from 'vitest'
import { getThemeById, themeRegistry } from './themeRegistry'

describe('themeRegistry', () => {
  it('provides 8 official user-centered theme profiles', () => {
    expect(themeRegistry.map((theme) => theme.id)).toEqual([
      'minimal-premium',
      'cream-dopamine',
      'ink-wash',
      'modern-chinese',
      'healing-anime',
      'morandi-gentle',
      'business-bluegray',
      'night-focus'
    ])
  })

  it('keeps every theme profile complete and accessible to the UI token system', () => {
    themeRegistry.forEach((theme) => {
      expect(theme.name).toBeTruthy()
      expect(theme.aesthetic).toBeTruthy()
      expect(theme.visualComfort).toBeTruthy()
      expect(theme.recommendedFor.length).toBeGreaterThan(0)
      expect(theme.accessibilityNotes.length).toBeGreaterThan(0)
      expect(theme.wallpaperSupport).toBeTruthy()
      expect(theme.tokens.colors.background).toBeTruthy()
      expect(theme.tokens.colors.surface).toBeTruthy()
      expect(theme.tokens.colors.surfaceStrong).toBeTruthy()
      expect(theme.tokens.colors.primary).toBeTruthy()
      expect(theme.tokens.colors.secondary).toBeTruthy()
      expect(theme.tokens.colors.accent).toBeTruthy()
      expect(theme.tokens.colors.text).toBeTruthy()
      expect(theme.tokens.colors.muted).toBeTruthy()
      expect(theme.tokens.colors.border).toBeTruthy()
      expect(theme.tokens.gradients.hero).toBeTruthy()
      expect(theme.tokens.gradients.card).toBeTruthy()
      expect(theme.tokens.charts.plan).toBeTruthy()
      expect(theme.tokens.charts.focus).toBeTruthy()
      expect(theme.tokens.charts.review).toBeTruthy()
      expect(theme.tokens.effects.radius).toBeTruthy()
      expect(theme.tokens.effects.shadow).toBeTruthy()
      expect(theme.tokens.effects.glass).toBeTruthy()
    })
  })

  it('separates ink wash from modern Chinese style', () => {
    const inkWash = getThemeById('ink-wash')
    const modernChinese = getThemeById('modern-chinese')

    expect(inkWash.name).toBe('水墨留白')
    expect(inkWash.aesthetic).toBe('ink')
    expect(inkWash.recommendedFor).toContain('深度学习')

    expect(modernChinese.name).toBe('新中式国风')
    expect(modernChinese.aesthetic).toBe('chinese')
    expect(modernChinese.recommendedFor).toContain('传统文化偏好')
  })

  it('keeps minimal and cream dopamine as default onboarding candidates', () => {
    const minimal = getThemeById('minimal-premium')
    const dopamine = getThemeById('cream-dopamine')

    expect(minimal.defaultCandidate).toBe(true)
    expect(dopamine.defaultCandidate).toBe(true)
    expect(minimal.visualComfort).toContain('低噪音')
    expect(dopamine.visualComfort).toContain('小面积高亮')
  })

  it('falls back to minimal premium when a theme is missing', () => {
    expect(getThemeById('unknown-theme').id).toBe('minimal-premium')
  })
})
```

- [ ] **Step 2: Run the theme tests and verify RED**

Run:

```bash
npm test -- src/themes/themeRegistry.test.ts
```

Expected: fail because theme IDs and metadata fields do not exist yet.

---

### Task 2: Implement the 8 Theme Profiles

**Files:**
- Modify: `src/themes/themeRegistry.ts`

- [ ] **Step 1: Replace the current theme type definitions with backward-compatible Theme Profile definitions**

Use this exported type shape:

```ts
export type ThemeId =
  | 'minimal-premium'
  | 'cream-dopamine'
  | 'ink-wash'
  | 'modern-chinese'
  | 'healing-anime'
  | 'morandi-gentle'
  | 'business-bluegray'
  | 'night-focus'

export type ThemeAesthetic =
  | 'minimal'
  | 'dopamine'
  | 'ink'
  | 'chinese'
  | 'anime'
  | 'morandi'
  | 'business'
  | 'night'

export type WallpaperSupport = {
  overlay: string
  blur: string
  brightness: string
  saturation: string
}

export type StudyTheme = {
  id: ThemeId
  name: string
  category: 'built-in' | 'extension'
  aesthetic: ThemeAesthetic
  defaultCandidate: boolean
  visualComfort: string
  recommendedFor: string[]
  accessibilityNotes: string[]
  wallpaperSupport: WallpaperSupport
  tokens: {
    colors: {
      background: string
      surface: string
      surfaceStrong: string
      primary: string
      secondary: string
      accent: string
      text: string
      muted: string
      border: string
    }
    gradients: {
      hero: string
      card: string
    }
    charts: {
      plan: string
      focus: string
      review: string
    }
    effects: {
      radius: string
      shadow: string
      glass: string
    }
  }
}
```

- [ ] **Step 2: Implement `themeRegistry` with 8 themes**

Use the following theme IDs and names:

```ts
export const themeRegistry: StudyTheme[] = [
  {
    id: 'minimal-premium',
    name: '极简高级感',
    category: 'built-in',
    aesthetic: 'minimal',
    defaultCandidate: true,
    visualComfort: '低噪音、低饱和、适合长时间学习和办公',
    recommendedFor: ['长期使用', '办公学习', '信息密度偏好', '极简偏好'],
    accessibilityNotes: ['正文使用深灰蓝', '强调色小面积使用', '适合作为默认候选'],
    wallpaperSupport: { overlay: 'rgba(248, 247, 242, 0.72)', blur: '14px', brightness: '0.96', saturation: '0.82' },
    tokens: {
      colors: {
        background: 'linear-gradient(135deg, #f8f7f2 0%, #ece8de 55%, #e7ece9 100%)',
        surface: 'rgba(255, 255, 255, 0.82)',
        surfaceStrong: '#ffffff',
        primary: '#2f4858',
        secondary: '#8fa6a3',
        accent: '#d8a75f',
        text: '#20242c',
        muted: '#667085',
        border: 'rgba(47, 72, 88, 0.14)'
      },
      gradients: {
        hero: 'linear-gradient(90deg, #2f4858, #8fa6a3)',
        card: 'linear-gradient(135deg, #ffffff, #f0eee7)'
      },
      charts: { plan: '#2f4858', focus: '#8fa6a3', review: '#d8a75f' },
      effects: { radius: '24px', shadow: '0 18px 42px rgba(47, 72, 88, 0.12)', glass: 'blur(16px)' }
    }
  }
]
```

Then add the remaining seven profiles with the following token intent:

- `cream-dopamine`: 奶油底色、柔雾粉、浅黄、薄荷绿，小面积高亮。
- `ink-wash`: 宣纸米白、淡墨、松烟黑、灰绿，强调留白。
- `modern-chinese`: 米白、青绿、朱砂、墨色，强调文化感。
- `healing-anime`: 奶油白、樱粉、天青、电光紫，强调治愈陪伴。
- `morandi-gentle`: 灰粉、灰蓝、豆绿、暖米色，强调低刺激。
- `business-bluegray`: 冷白、蓝灰、深蓝、少量金色，强调交付和效率。
- `night-focus`: 深蓝灰、非纯黑背景、柔和浅蓝和薄荷绿，强调低眩光。

- [ ] **Step 3: Keep fallback behavior stable**

Ensure this remains exported:

```ts
export const getThemeById = (themeId: string): StudyTheme =>
  themeRegistry.find((theme) => theme.id === themeId) ?? themeRegistry[0]
```

- [ ] **Step 4: Run theme tests and verify GREEN**

Run:

```bash
npm test -- src/themes/themeRegistry.test.ts
```

Expected: pass.

---

### Task 3: Update app tests for new default theme names

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Run current app tests to identify old theme-name expectations**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: may fail if the UI still expects names such as `高级校园` or old IDs.

- [ ] **Step 2: Update visible theme assertions**

If the test references old built-in theme names, replace them with new visible theme names:

```ts
expect(screen.getByText('极简高级感')).toBeInTheDocument()
expect(screen.getByText('轻多巴胺年轻感')).toBeInTheDocument()
expect(screen.getByText('水墨留白')).toBeInTheDocument()
expect(screen.getByText('新中式国风')).toBeInTheDocument()
```

- [ ] **Step 3: Run app tests and verify GREEN**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: pass.

---

### Task 4: Fix app compatibility if TypeScript or runtime fails

**Files:**
- Modify only if needed: `src/App.tsx`
- Modify only if needed: `src/styles.css`

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: pass. If it fails because default state references an old theme ID, update the default preference in the store in a later data migration task or add a compatibility fallback in the current theme lookup path.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: pass.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: pass.

---

### Task 5: Browser verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Start the development server**

Run:

```bash
npm run dev
```

Expected: Vite serves the app on a local URL such as `http://localhost:5173/`.

- [ ] **Step 2: Open the local page**

Open the Vite URL in browser automation.

Expected:

- Page is not blank.
- Theme center renders all 8 theme names.
- Switching between at least two themes updates the UI colors.
- Console has no errors.
- Network has no failed app requests.

---

## Self-review

- Spec coverage: This plan covers only the first implementation module from the design spec: Theme Profile system and 8 official themes. Wallpaper upload, Persona homepage, feature modules, female cycle management, and privacy data model remain separate follow-up plans.
- Placeholder scan: The plan contains no unfinished placeholders. The only flexible part is the exact color values for seven themes, constrained by explicit token intent from the spec.
- Type consistency: The exported compatibility type remains `StudyTheme` to avoid breaking current imports. Internally it now represents the broader Theme Profile concept.
- Git safety: Do not commit or push unless the user explicitly requests it.
