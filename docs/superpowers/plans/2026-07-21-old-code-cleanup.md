# 旧方向代码清理 + 构建验证 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清理旧情绪健康方向的残留代码，消除死代码对包体积和编译的影响，验证构建和测试通过。

**Architecture:** 删除8个旧方向文件，修改6个引用文件移除旧方向导入和逻辑，PetDeceasedModal保留但移除悲伤陪伴触发逻辑，最后全量验证。

**Tech Stack:** Taro 3 + React + TypeScript + Vitest

---

### Task 1: 删除旧方向引擎和类型文件

**Files:**
- Delete: `src/engines/emotion.ts`
- Delete: `src/types/emotionTypes.ts`

- [ ] **Step 1: 删除 emotion.ts**

```bash
del "e:\星寰海\03-源代码\小程序\miniapp\src\engines\emotion.ts"
```

- [ ] **Step 2: 删除 emotionTypes.ts**

```bash
del "e:\星寰海\03-源代码\小程序\miniapp\src\types\emotionTypes.ts"
```

---

### Task 2: 删除旧方向 Store 文件

**Files:**
- Delete: `src/stores/emotionStore.ts`

- [ ] **Step 1: 删除 emotionStore.ts**

```bash
del "e:\星寰海\03-源代码\小程序\miniapp\src\stores\emotionStore.ts"
```

---

### Task 3: 删除旧方向组件文件

**Files:**
- Delete: `src/components/GriefCompanion.tsx`
- Delete: `src/components/GriefCompanion.scss`
- Delete: `src/components/GriefCompanion.test.tsx`
- Delete: `src/components/EmotionResponseCard.tsx`
- Delete: `src/components/EmotionResponseCard.scss`

- [ ] **Step 1: 删除 GriefCompanion 相关文件**

```bash
del "e:\星寰海\03-源代码\小程序\miniapp\src\components\GriefCompanion.tsx"
del "e:\星寰海\03-源代码\小程序\miniapp\src\components\GriefCompanion.scss"
del "e:\星寰海\03-源代码\小程序\miniapp\src\components\GriefCompanion.test.tsx"
```

- [ ] **Step 2: 删除 EmotionResponseCard 相关文件**

```bash
del "e:\星寰海\03-源代码\小程序\miniapp\src\components\EmotionResponseCard.tsx"
del "e:\星寰海\03-源代码\小程序\miniapp\src\components\EmotionResponseCard.scss"
```

---

### Task 4: 清理 barrel 导出文件

**Files:**
- Modify: `src/engines/index.ts` - 移除 emotion 引擎的 re-export
- Modify: `src/stores/index.ts` - 移除 emotionStore 的 re-export
- Modify: `src/components/index.ts` - 移除 EmotionResponseCard 的 re-export

- [ ] **Step 1: 修改 engines/index.ts**

移除所有 emotion 引擎的 re-export 行（约 lines 21-40），只保留 petSafety 和 petAvatar 的导出。

- [ ] **Step 2: 修改 stores/index.ts**

移除 `export { useEmotionStore } from './emotionStore'` 行。

- [ ] **Step 3: 修改 components/index.ts**

移除 `export { default as EmotionResponseCard } from './EmotionResponseCard'` 行。

- [ ] **Step 4: 运行类型检查确认无残留引用**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 5: 清理首页旧方向代码

**Files:**
- Modify: `src/pages/index/index.tsx`

需要移除的内容：
1. `import { useEmotionStore } from '../../stores/emotionStore'` 导入
2. `EmotionResponseCard` 从 components 导入
3. `import type { EmotionIntervention } from '../../engines/emotion'` 类型导入
4. `useEmotionStore` 的5个选择器（activeIntervention, checkSickAnxiety, checkNewOwnerAnxiety, dismissIntervention, respondToIntervention）
5. sick anxiety 检查的 useEffect
6. new owner anxiety 检查的 useEffect
7. `handleEmotionAction` 回调
8. `handleEmotionDismiss` 回调
9. `<EmotionResponseCard>` JSX 渲染块

- [ ] **Step 1: 移除旧方向导入**

从 index.tsx 中删除：
- `import { useEmotionStore } from '../../stores/emotionStore'`
- `EmotionResponseCard` 从 `../../components` 导入列表中移除
- `import type { EmotionIntervention } from '../../engines/emotion'`

- [ ] **Step 2: 移除 useEmotionStore 选择器**

删除所有 `useEmotionStore` 相关的选择器调用。

- [ ] **Step 3: 移除旧方向 useEffect**

删除 sick anxiety 和 new owner anxiety 检查的两个 useEffect 块。

- [ ] **Step 4: 移除旧方向回调**

删除 `handleEmotionAction` 和 `handleEmotionDismiss` 回调函数。

- [ ] **Step 5: 移除 EmotionResponseCard JSX**

删除 `<EmotionResponseCard>` 渲染块。

- [ ] **Step 6: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 6: 清理宠物档案页旧方向代码

**Files:**
- Modify: `src/pages/pet-profile/index.tsx`
- Modify: `src/pages/pet-profile/index.scss`

需要移除的内容：
1. `const GriefCompanion = lazy(() => import('../../components/GriefCompanion'))` 懒导入
2. `showGriefCompanion` / `griefPet` 状态
3. `handlePetClick` 中已故宠物分支的悲伤陪伴触发
4. `handleDeceasedConfirm` 中的 `setGriefPet` / `setShowGriefCompanion` 调用
5. `<GriefCompanion>` JSX 渲染块
6. `.pet-profile__grief-overlay` 样式

- [ ] **Step 1: 移除 GriefCompanion 懒导入**

删除 `const GriefCompanion = lazy(...)` 行。

- [ ] **Step 2: 移除悲伤陪伴状态**

删除 `showGriefCompanion` 和 `griefPet` 的 useState 声明。

- [ ] **Step 3: 修改 handlePetClick**

移除已故宠物分支中打开悲伤陪伴的逻辑，保留已故宠物的其他处理。

- [ ] **Step 4: 修改 handleDeceasedConfirm**

移除 `setGriefPet` 和 `setShowGriefCompanion` 调用，保留其他已故确认逻辑。

- [ ] **Step 5: 移除 GriefCompanion JSX**

删除整个 `<GriefCompanion>` 渲染块。

- [ ] **Step 6: 移除 grief overlay 样式**

从 index.scss 中删除 `.pet-profile__grief-overlay` 样式块。

- [ ] **Step 7: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 7: 全量验证

**Files:** 无新增修改

- [ ] **Step 1: 运行全量类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: 运行全量测试**

Run: `npx vitest run`
Expected: 所有测试通过（预计减少约10+个旧方向测试）

- [ ] **Step 3: 运行构建**

Run: `npm run build:weapp`
Expected: 构建成功，无错误

- [ ] **Step 4: 更新看板和项目记忆**

执行 update-board.bat 和 sync-memory-to-board.cjs，记录清理结果。
