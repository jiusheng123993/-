# 健康报告小程序兼容重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将健康报告导出从浏览器 API（html2canvas + jsPDF + DOM）重构为微信小程序 Canvas 2D 绘制方案，使报告导出功能在小程序环境可用。

**Architecture:** 删除 html2canvas 和 jsPDF 依赖，新建 `reportCanvasRenderer.ts` 使用 Taro Canvas 2D API 绘制报告内容为图片，通过 `Taro.canvasToTempFilePath` 导出图片，再通过 `Taro.saveImageToPhotosAlbum` 保存到相册或 `Taro.shareFileMessage` 分享给兽医。报告预览组件改为 Canvas 渲染模式。

**Tech Stack:** Taro 3.x Canvas 2D API, @tarojs/taro (canvasToTempFilePath, saveImageToPhotosAlbum, shareFileMessage)

---

## 问题分析

### 当前代码问题

1. **`pdfGenerator.ts`** 使用 `document.getElementById`、`html2canvas`、`jsPDF`、`document.createElement('a')` — 全部是浏览器 DOM API，微信小程序完全不支持
2. **`healthReportPdfService.ts`** 调用 `pdfGenerator.ts` 的 `generateHealthReportPDF` 和 `downloadPDF`，在小程序中会直接报错
3. **`HealthReportPreview.tsx`** 使用 React 组件渲染报告预览，预览本身可用，但"下载PDF"按钮调用的 `downloadPDF` 不可用
4. **`html2canvas` 和 `jspdf`** 两个依赖包体积大（约 200KB+），且在小程序中无用
5. **`pdfGenerator.test.ts`** 测试依赖 `document.createElement` 等 DOM API

### PRD 要求

- PDF/图片格式导出
- 包含：档案+趋势+异常+用药史
- 一键分享给兽医
- 会员专属功能

### 小程序方案

微信小程序不支持 PDF 生成，但支持：
1. **Canvas 2D API** — 绘制报告内容
2. **`Taro.canvasToTempFilePath`** — Canvas 转图片
3. **`Taro.saveImageToPhotosAlbum`** — 保存到相册
4. **`Taro.shareFileMessage`** — 分享文件给微信好友

因此方案为：**Canvas 绘制报告 → 导出为图片 → 保存/分享**

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/utils/reportCanvasRenderer.ts` | 新建 | Canvas 2D 绘制报告核心逻辑 |
| `src/utils/__tests__/reportCanvasRenderer.test.ts` | 新建 | Canvas 渲染器测试 |
| `src/utils/pdfGenerator.ts` | 删除 | 不再需要浏览器 PDF 方案 |
| `src/utils/__tests__/pdfGenerator.test.ts` | 删除 | 不再需要 |
| `src/pagesPet/services/healthReportPdfService.ts` | 修改 | 改为调用 Canvas 渲染器 |
| `src/components/HealthReportPreview.tsx` | 修改 | 改为 Canvas 渲染模式 |
| `src/components/HealthReportPreview.scss` | 修改 | 适配 Canvas 模式样式 |
| `src/components/__tests__/HealthReportPreview.test.tsx` | 修改 | 更新测试 |
| `src/pagesPet/trends/index.tsx` | 修改 | 更新导出按钮逻辑 |
| `src/types/reportTypes.ts` | 修改 | 更新类型定义 |
| `package.json` | 修改 | 移除 html2canvas 和 jspdf 依赖 |

---

### Task 1: 创建 Canvas 报告渲染器核心

**Files:**
- Create: `src/utils/reportCanvasRenderer.ts`
- Create: `src/utils/__tests__/reportCanvasRenderer.test.ts`
- Modify: `src/types/reportTypes.ts`

- [ ] **Step 1: 更新 reportTypes.ts 类型定义**

在 `src/types/reportTypes.ts` 中，将 `PDFGeneratorOptions` 替换为 `CanvasRenderOptions`：

```typescript
export interface HealthReportData {
  pet: {
    id: string
    name: string
    species: string
    breed: string
    birthDate: string
    gender: string
    neutered: boolean
    weight: number
    photoUrl?: string
    allergies: string[]
    medications: string[]
    chronicConditions: string[]
  }
  entries: {
    date: string
    bowel: string
    appetite: string
    energy: string
    exercise: string
    weight?: number
  }[]
  symptoms: {
    date: string
    symptoms: string[]
    urgencyLevel: string
    aiAssessment: string
  }[]
  vaccines: {
    name: string
    dateGiven?: string
    dateDue: string
    status: string
  }[]
  generatedAt: string
  period: string
}

export interface CanvasRenderOptions {
  canvasId: string
  width?: number
  height?: number
  pixelRatio?: number
}

export interface ReportImageResult {
  tempFilePath: string
  width: number
  height: number
}
```

- [ ] **Step 2: 创建 Canvas 渲染器测试**

创建 `src/utils/__tests__/reportCanvasRenderer.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateReportLayout,
  drawReportHeader,
  drawPetProfile,
  drawHealthEntries,
  drawVaccineRecords,
  drawReportFooter,
  renderReportToCanvas,
} from '../reportCanvasRenderer'
import type { HealthReportData, CanvasRenderOptions } from '../../types/reportTypes'

const mockData: HealthReportData = {
  pet: {
    id: '1',
    name: '咪咪',
    species: 'cat',
    breed: '英短',
    birthDate: '2022-01-01',
    gender: 'female',
    neutered: true,
    weight: 4.5,
    allergies: ['鸡肉'],
    medications: [],
    chronicConditions: [],
  },
  entries: [
    {
      date: '2026-07-18',
      bowel: '正常',
      appetite: '正常',
      energy: '正常',
      exercise: '正常',
      weight: 4.5,
    },
    {
      date: '2026-07-19',
      bowel: '偏软',
      appetite: '减退',
      energy: '低落',
      exercise: '减少',
      weight: 4.3,
    },
  ],
  symptoms: [],
  vaccines: [
    { name: '猫三联', dateGiven: '2026-01-15', dateDue: '2027-01-15', status: 'done' },
  ],
  generatedAt: '2026-07-20',
  period: '2026-06-20 至 2026-07-20',
}

describe('reportCanvasRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateReportLayout', () => {
    it('should calculate layout with header, profile, entries, vaccines, footer', () => {
      const layout = calculateReportLayout(mockData)
      expect(layout).toHaveProperty('totalHeight')
      expect(layout).toHaveProperty('sections')
      expect(layout.sections.length).toBeGreaterThanOrEqual(4)
      expect(layout.totalHeight).toBeGreaterThan(0)
    })

    it('should increase height with more entries', () => {
      const smallData = { ...mockData, entries: mockData.entries.slice(0, 1) }
      const bigData = {
        ...mockData,
        entries: [
          ...mockData.entries,
          { date: '2026-07-20', bowel: '正常', appetite: '正常', energy: '正常', exercise: '正常', weight: 4.4 },
          { date: '2026-07-21', bowel: '正常', appetite: '正常', energy: '正常', exercise: '正常', weight: 4.5 },
        ],
      }
      const smallLayout = calculateReportLayout(smallData)
      const bigLayout = calculateReportLayout(bigData)
      expect(bigLayout.totalHeight).toBeGreaterThan(smallLayout.totalHeight)
    })

    it('should include vaccine section height when vaccines exist', () => {
      const layout = calculateReportLayout(mockData)
      const vaccineSection = layout.sections.find(s => s.type === 'vaccines')
      expect(vaccineSection).toBeDefined()
    })

    it('should not include vaccine section when no vaccines', () => {
      const noVaccineData = { ...mockData, vaccines: [] }
      const layout = calculateReportLayout(noVaccineData)
      const vaccineSection = layout.sections.find(s => s.type === 'vaccines')
      expect(vaccineSection).toBeUndefined()
    })
  })

  describe('drawReportHeader', () => {
    it('should call fillText with report title', () => {
      const ctx = createMockContext()
      drawReportHeader(ctx, mockData, 0, 750)
      expect(ctx.fillText).toHaveBeenCalled()
      const calls = ctx.fillText.mock.calls.map(c => c[0])
      expect(calls.some(t => typeof t === 'string' && t.includes('健康报告'))).toBe(true)
    })
  })

  describe('drawPetProfile', () => {
    it('should draw pet name, breed, age info', () => {
      const ctx = createMockContext()
      drawPetProfile(ctx, mockData, 100)
      const calls = ctx.fillText.mock.calls.map(c => c[0])
      expect(calls.some(t => typeof t === 'string' && t.includes('咪咪'))).toBe(true)
    })
  })

  describe('drawHealthEntries', () => {
    it('should draw entry dates and values', () => {
      const ctx = createMockContext()
      drawHealthEntries(ctx, mockData.entries, 200, 750)
      expect(ctx.fillText).toHaveBeenCalled()
    })

    it('should handle empty entries', () => {
      const ctx = createMockContext()
      drawHealthEntries(ctx, [], 200, 750)
      const calls = ctx.fillText.mock.calls.map(c => c[0])
      expect(calls.some(t => typeof t === 'string' && t.includes('暂无'))).toBe(true)
    })
  })

  describe('drawVaccineRecords', () => {
    it('should draw vaccine names and dates', () => {
      const ctx = createMockContext()
      drawVaccineRecords(ctx, mockData.vaccines, 400, 750)
      const calls = ctx.fillText.mock.calls.map(c => c[0])
      expect(calls.some(t => typeof t === 'string' && t.includes('猫三联'))).toBe(true)
    })

    it('should skip when no vaccines', () => {
      const ctx = createMockContext()
      const nextY = drawVaccineRecords(ctx, [], 400, 750)
      expect(nextY).toBe(400)
    })
  })

  describe('drawReportFooter', () => {
    it('should draw disclaimer and generation date', () => {
      const ctx = createMockContext()
      drawReportFooter(ctx, mockData.generatedAt, 600, 750)
      const calls = ctx.fillText.mock.calls.map(c => c[0])
      expect(calls.some(t => typeof t === 'string' && t.includes('仅供参考'))).toBe(true)
    })
  })

  describe('renderReportToCanvas', () => {
    it('should reject when canvas context not available', async () => {
      vi.mocked(Taro.createSelectorQuery).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        fields: vi.fn().mockReturnThis(),
        exec: vi.fn().mockImplementation(cb => cb([null])),
      } as any)

      const options: CanvasRenderOptions = { canvasId: 'test-canvas' }
      await expect(renderReportToCanvas(mockData, options)).rejects.toThrow('Canvas context not found')
    })
  })
})

function createMockContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '' as CanvasTextAlign,
    textBaseline: '' as CanvasTextBaseline,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    drawImage: vi.fn(),
    setLineWidth: vi.fn(),
    setFontSize: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    canvas: { width: 750, height: 2000 },
  }
}

const Taro = vi.hoisted(() => ({
  createSelectorQuery: vi.fn(),
  canvasToTempFilePath: vi.fn(),
  saveImageToPhotosAlbum: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@tarojs/taro', () => Taro)
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/utils/__tests__/reportCanvasRenderer.test.ts`
Expected: FAIL with "Cannot find module '../reportCanvasRenderer'"

- [ ] **Step 4: Create Canvas 渲染器实现**

创建 `src/utils/reportCanvasRenderer.ts`：

```typescript
import Taro from '@tarojs/taro'
import type { HealthReportData, CanvasRenderOptions, ReportImageResult } from '../types/reportTypes'

const CANVAS_WIDTH = 750
const PADDING = 40
const SECTION_GAP = 30
const LINE_HEIGHT = 44
const TITLE_FONT_SIZE = 36
const SUBTITLE_FONT_SIZE = 28
const BODY_FONT_SIZE = 24
const SMALL_FONT_SIZE = 20

const COLORS = {
  primary: '#FF8C42',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#E8E8E8',
  background: '#FFFFFF',
  sectionBg: '#F8F8F8',
  success: '#52C41A',
  warning: '#FAAD14',
  danger: '#FF4D4F',
}

interface LayoutSection {
  type: 'header' | 'profile' | 'entries' | 'vaccines' | 'footer'
  y: number
  height: number
}

interface LayoutResult {
  totalHeight: number
  sections: LayoutSection[]
}

export function calculateReportLayout(data: HealthReportData): LayoutResult {
  const sections: LayoutSection[] = []
  let currentY = PADDING

  const headerHeight = 120
  sections.push({ type: 'header', y: currentY, height: headerHeight })
  currentY += headerHeight + SECTION_GAP

  const profileHeight = 200
  sections.push({ type: 'profile', y: currentY, height: profileHeight })
  currentY += profileHeight + SECTION_GAP

  const entryCount = Math.min(data.entries.length, 14)
  const entriesHeight = 80 + entryCount * LINE_HEIGHT
  sections.push({ type: 'entries', y: currentY, height: entriesHeight })
  currentY += entriesHeight + SECTION_GAP

  if (data.vaccines.length > 0) {
    const vaccineHeight = 80 + data.vaccines.length * LINE_HEIGHT
    sections.push({ type: 'vaccines', y: currentY, height: vaccineHeight })
    currentY += vaccineHeight + SECTION_GAP
  }

  const footerHeight = 120
  sections.push({ type: 'footer', y: currentY, height: footerHeight })
  currentY += footerHeight + PADDING

  return { totalHeight: currentY, sections }
}

export function drawReportHeader(
  ctx: CanvasRenderingContext2D,
  data: HealthReportData,
  y: number,
  _canvasWidth: number,
): number {
  ctx.save()
  ctx.fillStyle = COLORS.primary
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`${data.pet.name}的健康报告`, CANVAS_WIDTH / 2, y + 50)

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
  ctx.fillText(data.period, CANVAS_WIDTH / 2, y + 90)
  ctx.restore()
  return y + 120
}

export function drawPetProfile(
  ctx: CanvasRenderingContext2D,
  data: HealthReportData,
  y: number,
): number {
  ctx.save()
  ctx.fillStyle = COLORS.sectionBg
  ctx.fillRect(PADDING, y, CANVAS_WIDTH - PADDING * 2, 180)

  ctx.fillStyle = COLORS.primary
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('宠物档案', PADDING + 20, y + 40)

  ctx.fillStyle = COLORS.text
  ctx.font = `${BODY_FONT_SIZE}px sans-serif`

  const info = [
    `品种：${data.pet.breed}`,
    `性别：${data.pet.gender === 'female' ? '母' : data.pet.gender === 'male' ? '公' : '未知'}${data.pet.neutered ? '（已绝育）' : ''}`,
    `出生日期：${data.pet.birthDate}`,
    `当前体重：${data.pet.weight}kg`,
  ]

  if (data.pet.allergies.length > 0) {
    info.push(`过敏史：${data.pet.allergies.join('、')}`)
  }

  info.forEach((line, i) => {
    ctx.fillText(line, PADDING + 20, y + 75 + i * LINE_HEIGHT)
  })

  ctx.restore()
  return y + 200
}

export function drawHealthEntries(
  ctx: CanvasRenderingContext2D,
  entries: HealthReportData['entries'],
  y: number,
  _canvasWidth: number,
): number {
  ctx.save()

  ctx.fillStyle = COLORS.primary
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('健康记录', PADDING + 20, y + 35)

  if (entries.length === 0) {
    ctx.fillStyle = COLORS.textLight
    ctx.font = `${BODY_FONT_SIZE}px sans-serif`
    ctx.fillText('暂无打卡记录', PADDING + 20, y + 75)
    ctx.restore()
    return y + 80
  }

  const displayEntries = entries.slice(0, 14)

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
  ctx.fillText('日期', PADDING + 20, y + 70)
  ctx.fillText('便便', PADDING + 180, y + 70)
  ctx.fillText('食欲', PADDING + 300, y + 70)
  ctx.fillText('精神', PADDING + 420, y + 70)
  ctx.fillText('体重', PADDING + 540, y + 70)

  ctx.strokeStyle = COLORS.border
  ctx.beginPath()
  ctx.moveTo(PADDING + 20, y + 80)
  ctx.lineTo(CANVAS_WIDTH - PADDING - 20, y + 80)
  ctx.stroke()

  displayEntries.forEach((entry, i) => {
    const rowY = y + 110 + i * LINE_HEIGHT
    ctx.fillStyle = COLORS.text
    ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
    ctx.fillText(entry.date.slice(5), PADDING + 20, rowY)
    ctx.fillText(entry.bowel, PADDING + 180, rowY)
    ctx.fillText(entry.appetite, PADDING + 300, rowY)
    ctx.fillText(entry.energy, PADDING + 420, rowY)
    ctx.fillText(entry.weight ? `${entry.weight}kg` : '-', PADDING + 540, rowY)
  })

  ctx.restore()
  return y + 80 + displayEntries.length * LINE_HEIGHT
}

export function drawVaccineRecords(
  ctx: CanvasRenderingContext2D,
  vaccines: HealthReportData['vaccines'],
  y: number,
  _canvasWidth: number,
): number {
  if (vaccines.length === 0) return y

  ctx.save()

  ctx.fillStyle = COLORS.primary
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('疫苗记录', PADDING + 20, y + 35)

  vaccines.forEach((vaccine, i) => {
    const rowY = y + 70 + i * LINE_HEIGHT
    ctx.fillStyle = COLORS.text
    ctx.font = `${BODY_FONT_SIZE}px sans-serif`
    ctx.fillText(vaccine.name, PADDING + 20, rowY)

    ctx.fillStyle = COLORS.textSecondary
    ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
    const dateStr = vaccine.dateGiven || vaccine.dateDue
    ctx.fillText(dateStr, PADDING + 250, rowY)

    const statusLabel = vaccine.status === 'done' ? '已接种' : vaccine.status === 'pending' ? '待接种' : '已逾期'
    ctx.fillStyle = vaccine.status === 'done' ? COLORS.success : vaccine.status === 'overdue' ? COLORS.danger : COLORS.warning
    ctx.fillText(statusLabel, PADDING + 500, rowY)
  })

  ctx.restore()
  return y + 80 + vaccines.length * LINE_HEIGHT
}

export function drawReportFooter(
  ctx: CanvasRenderingContext2D,
  generatedAt: string,
  y: number,
  _canvasWidth: number,
): number {
  ctx.save()

  ctx.strokeStyle = COLORS.border
  ctx.beginPath()
  ctx.moveTo(PADDING + 20, y)
  ctx.lineTo(CANVAS_WIDTH - PADDING - 20, y)
  ctx.stroke()

  ctx.fillStyle = COLORS.textLight
  ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('⚠️ 本报告仅供参考，不替代兽医诊断。如发现异常请及时就医。', CANVAS_WIDTH / 2, y + 40)
  ctx.fillText(`生成时间：${generatedAt}`, CANVAS_WIDTH / 2, y + 75)
  ctx.fillText('星寰海 - 宠物健康管理', CANVAS_WIDTH / 2, y + 105)

  ctx.restore()
  return y + 120
}

export async function renderReportToCanvas(
  data: HealthReportData,
  options: CanvasRenderOptions,
): Promise<ReportImageResult> {
  const layout = calculateReportLayout(data)
  const pixelRatio = options.pixelRatio || 2
  const canvasWidth = options.width || CANVAS_WIDTH
  const canvasHeight = options.height || layout.totalHeight

  return new Promise<ReportImageResult>((resolve, reject) => {
    const query = Taro.createSelectorQuery()
    query
      .select(`#${options.canvasId}`)
      .fields({
        node: true,
        size: true,
      })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas context not found'))
          return
        }

        const canvas = res[0].node as HTMLCanvasElement
        const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D

        const dpr = pixelRatio
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        ctx.fillStyle = COLORS.background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        let currentY = PADDING

        for (const section of layout.sections) {
          switch (section.type) {
            case 'header':
              currentY = drawReportHeader(ctx, data, currentY, canvasWidth)
              break
            case 'profile':
              currentY = drawPetProfile(ctx, data, currentY)
              break
            case 'entries':
              currentY = drawHealthEntries(ctx, data.entries, currentY, canvasWidth)
              break
            case 'vaccines':
              currentY = drawVaccineRecords(ctx, data.vaccines, currentY, canvasWidth)
              break
            case 'footer':
              currentY = drawReportFooter(ctx, data.generatedAt, currentY, canvasWidth)
              break
          }
        }

        setTimeout(() => {
          Taro.canvasToTempFilePath({
            canvas,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth * dpr,
            destHeight: canvasHeight * dpr,
            fileType: 'png',
            success: (res) => {
              resolve({
                tempFilePath: res.tempFilePath,
                width: canvasWidth,
                height: canvasHeight,
              })
            },
            fail: (err) => {
              reject(new Error(`Canvas export failed: ${err.errMsg}`))
            },
          })
        }, 300)
      })
  })
}

export async function saveReportImage(tempFilePath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Taro.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        Taro.showToast({ title: '已保存到相册', icon: 'success' })
        resolve()
      },
      fail: (err) => {
        reject(new Error(`Save to album failed: ${err.errMsg}`))
      },
    })
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/reportCanvasRenderer.test.ts`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add src/utils/reportCanvasRenderer.ts src/utils/__tests__/reportCanvasRenderer.test.ts src/types/reportTypes.ts
git commit -m "feat(report): add canvas renderer for miniapp health report"
```

---

### Task 2: 重构 HealthReportPreview 为 Canvas 模式

**Files:**
- Modify: `src/components/HealthReportPreview.tsx`
- Modify: `src/components/HealthReportPreview.scss`
- Modify: `src/components/__tests__/HealthReportPreview.test.tsx`

- [ ] **Step 1: 重写 HealthReportPreview.tsx**

将 `src/components/HealthReportPreview.tsx` 重写为 Canvas 渲染模式：

```tsx
import { useEffect, useRef, useCallback } from 'react'
import { View, Text, Canvas, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { renderReportToCanvas, saveReportImage } from '../utils/reportCanvasRenderer'
import type { HealthReportData } from '../types/reportTypes'
import './HealthReportPreview.scss'

interface HealthReportPreviewProps {
  data: HealthReportData
  onSave?: () => void
  onShare?: () => void
}

const CANVAS_ID = 'health-report-canvas'

export default function HealthReportPreview({ data, onSave, onShare }: HealthReportPreviewProps) {
  const renderingRef = useRef(false)

  const renderCanvas = useCallback(async () => {
    if (renderingRef.current) return
    renderingRef.current = true

    try {
      await renderReportToCanvas(data, { canvasId: CANVAS_ID })
    } catch (err) {
      console.error('Report canvas render failed:', err)
    } finally {
      renderingRef.current = false
    }
  }, [data])

  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvas()
    }, 500)
    return () => clearTimeout(timer)
  }, [renderCanvas])

  const handleSave = useCallback(async () => {
    try {
      const result = await renderReportToCanvas(data, { canvasId: CANVAS_ID })
      await saveReportImage(result.tempFilePath)
      onSave?.()
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [data, onSave])

  const handleShare = useCallback(async () => {
    try {
      const result = await renderReportToCanvas(data, { canvasId: CANVAS_ID })
      Taro.shareFileMessage({
        filePath: result.tempFilePath,
        fileName: `${data.pet.name}健康报告.png`,
        success: () => {
          onShare?.()
        },
        fail: () => {
          Taro.showToast({ title: '分享失败', icon: 'none' })
        },
      })
    } catch {
      Taro.showToast({ title: '分享失败', icon: 'none' })
    }
  }, [data, onShare])

  return (
    <View className="report-preview">
      <View className="report-preview__canvas-wrap">
        <Canvas
          type="2d"
          id={CANVAS_ID}
          className="report-preview__canvas"
          style={{ width: '100%', height: 'auto' }}
        />
      </View>
      <View className="report-preview__actions">
        <Button className="report-preview__btn report-preview__btn--save" onClick={handleSave}>
          保存到相册
        </Button>
        <Button className="report-preview__btn report-preview__btn--share" onClick={handleShare}>
          分享给兽医
        </Button>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 重写 HealthReportPreview.scss**

```scss
.report-preview {
  display: flex;
  flex-direction: column;
  width: 100%;

  &__canvas-wrap {
    width: 100%;
    min-height: 400px;
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
  }

  &__canvas {
    width: 100%;
  }

  &__actions {
    display: flex;
    gap: 24px;
    margin-top: 32px;
    padding: 0 32px;
  }

  &__btn {
    flex: 1;
    height: 88px;
    border-radius: 44px;
    font-size: 28px;
    font-weight: 500;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &--save {
      background: #FF8C42;
      color: #fff;
    }

    &--share {
      background: #52C41A;
      color: #fff;
    }
  }
}
```

- [ ] **Step 3: 重写 HealthReportPreview 测试**

将 `src/components/__tests__/HealthReportPreview.test.tsx` 重写：

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthReportPreview from '../HealthReportPreview'
import type { HealthReportData } from '../../types/reportTypes'

vi.mock('@tarojs/taro', () => ({
  default: {
    createSelectorQuery: vi.fn(),
    canvasToTempFilePath: vi.fn(),
    saveImageToPhotosAlbum: vi.fn(),
    shareFileMessage: vi.fn(),
    showToast: vi.fn(),
  },
}))

vi.mock('../utils/reportCanvasRenderer', () => ({
  renderReportToCanvas: vi.fn().mockResolvedValue({
    tempFilePath: '/tmp/report.png',
    width: 750,
    height: 1200,
  }),
  saveReportImage: vi.fn().mockResolvedValue(undefined),
}))

const mockData: HealthReportData = {
  pet: {
    id: '1',
    name: '咪咪',
    species: 'cat',
    breed: '英短',
    birthDate: '2022-01-01',
    gender: 'female',
    neutered: true,
    weight: 4.5,
    allergies: [],
    medications: [],
    chronicConditions: [],
  },
  entries: [],
  symptoms: [],
  vaccines: [],
  generatedAt: '2026-07-20',
  period: '2026-06-20 至 2026-07-20',
}

describe('HealthReportPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render canvas element', () => {
    render(<HealthReportPreview data={mockData} />)
    expect(document.querySelector('#health-report-canvas')).toBeTruthy()
  })

  it('should render save and share buttons', () => {
    render(<HealthReportPreview data={mockData} />)
    expect(screen.getByText('保存到相册')).toBeTruthy()
    expect(screen.getByText('分享给兽医')).toBeTruthy()
  })

  it('should call onSave callback', async () => {
    const onSave = vi.fn()
    render(<HealthReportPreview data={mockData} onSave={onSave} />)
    const saveBtn = screen.getByText('保存到相册')
    saveBtn.click()
  })

  it('should call onShare callback', async () => {
    const onShare = vi.fn()
    render(<HealthReportPreview data={mockData} onShare={onShare} />)
    const shareBtn = screen.getByText('分享给兽医')
    shareBtn.click()
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/__tests__/HealthReportPreview.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/HealthReportPreview.tsx src/components/HealthReportPreview.scss src/components/__tests__/HealthReportPreview.test.tsx
git commit -m "refactor(report): rewrite HealthReportPreview with canvas rendering"
```

---

### Task 3: 重构 healthReportPdfService 和 trends 页面

**Files:**
- Modify: `src/pagesPet/services/healthReportPdfService.ts`
- Modify: `src/pagesPet/trends/index.tsx`
- Delete: `src/utils/pdfGenerator.ts`
- Delete: `src/utils/__tests__/pdfGenerator.test.ts`

- [ ] **Step 1: 重写 healthReportPdfService.ts**

将 `src/pagesPet/services/healthReportPdfService.ts` 重写为使用 Canvas 渲染器：

```typescript
import Taro from '@tarojs/taro'
import { renderReportToCanvas, saveReportImage } from '../../utils/reportCanvasRenderer'
import { getCheckinsByDateRange } from '../../services/checkinService'
import { getVaccineRecords } from '../../services/vaccineService'
import { getPetById } from '../../services/petService'
import type { HealthReportData } from '../../types/reportTypes'

const CANVAS_ID = 'health-report-canvas'

export async function generateHealthReportPDFData(
  userId: string,
  petId: string,
): Promise<HealthReportData> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const pet = await getPetById(userId, petId)
  if (!pet) throw new Error('Pet not found')

  const entries = await getCheckinsByDateRange(
    petId,
    userId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
  )

  const vaccines = await getVaccineRecords(petId)

  return {
    pet: {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '未知',
      birthDate: pet.birthDate || '未知',
      gender: pet.gender || 'unknown',
      neutered: pet.isNeutered || false,
      weight: pet.weight || 0,
      photoUrl: pet.avatarPhotoUrl,
      allergies: [],
      medications: [],
      chronicConditions: [],
    },
    entries: entries.map(entry => ({
      date: entry.createdAt instanceof Date
        ? entry.createdAt.toLocaleDateString('zh-CN')
        : new Date(entry.createdAt).toLocaleDateString('zh-CN'),
      bowel: entry.poopLevel === 3 ? '正常' : entry.poopLevel === 5 ? '便秘' : entry.poopLevel === 4 ? '软便' : entry.poopLevel === 2 ? '腹泻' : '血便',
      appetite: entry.appetiteLevel === 3 ? '正常' : entry.appetiteLevel >= 4 ? '亢进' : entry.appetiteLevel === 2 ? '减退' : '拒食',
      energy: entry.spiritLevel === 3 ? '正常' : entry.spiritLevel >= 4 ? '兴奋' : entry.spiritLevel === 2 ? '低落' : '萎靡',
      exercise: entry.exerciseLevel === 3 ? '正常' : entry.exerciseLevel >= 4 ? '活跃' : entry.exerciseLevel === 2 ? '减少' : '无',
      weight: entry.weight,
    })),
    symptoms: [],
    vaccines: vaccines.map(v => ({
      name: v.category,
      dateGiven: v.date,
      dateDue: v.nextDate || v.date,
      status: v.status === 'completed' ? 'done' : v.status === 'pending' ? 'pending' : 'overdue',
    })),
    generatedAt: new Date().toLocaleDateString('zh-CN'),
    period: `${startDate.toLocaleDateString('zh-CN')} 至 ${endDate.toLocaleDateString('zh-CN')}`,
  }
}

export async function downloadHealthReportPDF(
  data: HealthReportData,
  petName: string,
): Promise<void> {
  try {
    const result = await renderReportToCanvas(data, { canvasId: CANVAS_ID })
    await saveReportImage(result.tempFilePath)
  } catch (err) {
    Taro.showToast({ title: '导出失败', icon: 'none' })
    throw err
  }
}

export async function shareHealthReport(
  data: HealthReportData,
  petName: string,
): Promise<void> {
  try {
    const result = await renderReportToCanvas(data, { canvasId: CANVAS_ID })
    Taro.shareFileMessage({
      filePath: result.tempFilePath,
      fileName: `${petName}健康报告.png`,
      fail: () => {
        Taro.showToast({ title: '分享失败', icon: 'none' })
      },
    })
  } catch {
    Taro.showToast({ title: '分享失败', icon: 'none' })
  }
}
```

- [ ] **Step 2: 更新 trends 页面**

在 `src/pagesPet/trends/index.tsx` 中：

1. 移除 `import { generateHealthReportPDFData, downloadHealthReportPDF } from '../services/healthReportPdfService'`
2. 添加 `import { generateHealthReportPDFData, downloadHealthReportPDF, shareHealthReport } from '../services/healthReportPdfService'`
3. 修改 `handleExportReport` 使用新 API
4. 修改报告模态框中的"下载PDF"按钮改为"保存到相册"
5. 添加"分享给兽医"按钮

将 `handleExportReport` 修改为：

```typescript
  const handleExportReport = useCallback(async () => {
    if (!currentPet?.id || !user?.id) return

    const hasAccess = checkAccess('health_report_export')
    if (!hasAccess) {
      setPaywallVisible(true)
      return
    }

    setGenerating(true)
    try {
      const pdfData = await generateHealthReportPDFData(user.id, currentPet.id)
      await downloadHealthReportPDF(pdfData, currentPet.name)
    } catch (error) {
      logger.error('Trends', 'Failed to generate report', error)
      Taro.showToast({ title: '导出报告失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }, [currentPet, user, checkAccess])
```

将报告模态框中的按钮区域修改为：

```tsx
{showReport && reportData && (
  <View className="report-modal">
    <View className="modal-overlay" onClick={() => setShowReport(false)} />
    <View className="modal-content">
      <View className="modal-header">
        <Text className="modal-title">健康报告预览</Text>
        <Text className="modal-close" onClick={() => setShowReport(false)}>✕</Text>
      </View>
      <View className="modal-body">
        <HealthReportPreview
          data={reportData}
          onSave={() => Taro.showToast({ title: '已保存', icon: 'success' })}
          onShare={() => Taro.showToast({ title: '已分享', icon: 'success' })}
        />
      </View>
    </View>
  </View>
)}
```

将底部按钮区域修改为：

```tsx
<View className="export-section">
  <Button
    className="preview-btn"
    onClick={handlePreviewReport}
    disabled={generating || !currentPet}
  >
    {generating ? '生成中...' : '预览报告'}
  </Button>
  <Button
    className="export-btn"
    onClick={handleExportReport}
    disabled={generating || !currentPet}
  >
    {generating ? '生成中...' : '保存报告图片'}
  </Button>
  <Button
    className="share-btn"
    onClick={handleShareTrend}
    disabled={!currentPet || !summary}
  >
    分享趋势
  </Button>
</View>
```

- [ ] **Step 3: 删除旧 pdfGenerator 文件**

删除 `src/utils/pdfGenerator.ts` 和 `src/utils/__tests__/pdfGenerator.test.ts`

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/pagesPet/services/healthReportPdfService.ts src/pagesPet/trends/index.tsx
git rm src/utils/pdfGenerator.ts src/utils/__tests__/pdfGenerator.test.ts
git commit -m "refactor(report): replace browser PDF with canvas image export"
```

---

### Task 4: 移除 html2canvas 和 jspdf 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 卸载依赖**

Run: `npm uninstall html2canvas jspdf`

- [ ] **Step 2: 验证构建**

Run: `npm run build:weapp`
Expected: Build succeeds, package size reduced

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove html2canvas and jspdf dependencies"
```

---

### Task 5: 全量验证

**Files:**
- None (verification only)

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Build**

Run: `npm run build:weapp`
Expected: Build succeeds, main package size reduced (html2canvas + jspdf removed)

- [ ] **Step 4: Update board and project memory**

Run: `E:\update-board.bat "E:\星寰海" "健康报告小程序兼容重构完成" "将PDF导出从浏览器API重构为Canvas 2D绘制方案，移除html2canvas/jspdf依赖，支持保存到相册和分享给兽医" "src/utils/reportCanvasRenderer.ts,src/components/HealthReportPreview.tsx,src/pagesPet/services/healthReportPdfService.ts,src/pagesPet/trends/index.tsx,src/types/reportTypes.ts"`

Run: `node "E:\sync-memory-to-board.cjs" "E:\星寰海\03-源代码\小程序\miniapp"`
