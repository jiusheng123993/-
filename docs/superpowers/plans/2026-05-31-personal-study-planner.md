# Personal Study Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful desktop personal learning planning and recording app with expandable themes, local persistence, and future cloud-sync extension points.

**Architecture:** Electron + Vite React + TypeScript is used because Rust/Tauri is unavailable in the current environment. The app separates UI, study data provider, and theme registry so future themes or cloud sync can be added without rewriting learning modules.

**Tech Stack:** React, TypeScript, Vite, Electron, Vitest, Testing Library, ESLint, lucide-react.

---

### Task 1: Project foundation

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `index.html`
- Create: `.gitignore`

- [x] Configure React, TypeScript, Vite, Electron, test, lint, and build scripts.
- [x] Install dependencies with `npm install`.

### Task 2: Theme registry

**Files:**
- Create: `src/themes/themeRegistry.test.ts`
- Create: `src/themes/themeRegistry.ts`

- [x] Write failing tests for built-in theme IDs, fallback theme behavior, and complete UI replacement tokens.
- [x] Verify RED with `npm test`.
- [x] Implement theme registry with `campus-premium`, `growth-rpg`, `dream-purple`, and `night-focus`.

### Task 3: Local data provider

**Files:**
- Create: `src/data/localStudyStore.test.ts`
- Create: `src/data/localStudyStore.ts`

- [x] Write failing tests for initial state and provider save/load contract.
- [x] Verify RED with `npm test`.
- [x] Implement initial learning state and memory/browser local storage providers.

### Task 4: Dashboard UI

**Files:**
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [x] Write failing tests for rendering dashboard and switching theme.
- [x] Implement desktop dashboard, side navigation, today panel, growth card, and theme center.
- [ ] Verify GREEN with `npm test`.

### Task 5: Desktop shell

**Files:**
- Create: `electron/main.cjs`

- [x] Implement Electron BrowserWindow shell for local desktop usage.
- [ ] Verify with `npm run build` and local browser preview.

### Task 6: Final verification

- [ ] Run `npm run lint`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start `npm run dev`.
- [ ] Open local page in browser and check no white screen, Console errors, or failed Network requests.
