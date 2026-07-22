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

const mockTaro = vi.hoisted(() => ({
  createSelectorQuery: vi.fn(),
  canvasToTempFilePath: vi.fn(),
  saveImageToPhotosAlbum: vi.fn(),
  showToast: vi.fn(),
}))

vi.mock('@tarojs/taro', () => ({
  default: mockTaro,
  ...mockTaro,
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

interface MockContext {
  fillStyle: string
  strokeStyle: string
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  fillRect: ReturnType<typeof vi.fn>
  strokeRect: ReturnType<typeof vi.fn>
  fillText: ReturnType<typeof vi.fn>
  strokeText: ReturnType<typeof vi.fn>
  measureText: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  closePath: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  drawImage: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  clip: ReturnType<typeof vi.fn>
  rect: ReturnType<typeof vi.fn>
  scale: ReturnType<typeof vi.fn>
  globalAlpha: number
  canvas: { width: number; height: number }
}

function createMockContext(): MockContext {
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
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    scale: vi.fn(),
    globalAlpha: 1,
    canvas: { width: 750, height: 2000 },
  }
}

function asCtx(ctx: MockContext): CanvasRenderingContext2D {
  return ctx as unknown as CanvasRenderingContext2D
}

function getFillTextCalls(ctx: MockContext): string[] {
  return ctx.fillText.mock.calls.map((c: any[]) => c[0] as string)
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

    it('should include vaccine section when vaccines exist', () => {
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
      drawReportHeader(asCtx(ctx), mockData, 0, 750)
      expect(ctx.fillText).toHaveBeenCalled()
      expect(getFillTextCalls(ctx).some(t => t.includes('健康报告'))).toBe(true)
    })
  })

  describe('drawPetProfile', () => {
    it('should draw pet breed and weight info', () => {
      const ctx = createMockContext()
      drawPetProfile(asCtx(ctx), mockData, 100)
      expect(getFillTextCalls(ctx).some(t => t.includes('英短'))).toBe(true)
      expect(getFillTextCalls(ctx).some(t => t.includes('4.5kg'))).toBe(true)
    })
  })

  describe('drawHealthEntries', () => {
    it('should draw entry dates and values', () => {
      const ctx = createMockContext()
      drawHealthEntries(asCtx(ctx), mockData.entries, 200, 750)
      expect(ctx.fillText).toHaveBeenCalled()
    })

    it('should handle empty entries', () => {
      const ctx = createMockContext()
      drawHealthEntries(asCtx(ctx), [], 200, 750)
      expect(getFillTextCalls(ctx).some(t => t.includes('暂无'))).toBe(true)
    })
  })

  describe('drawVaccineRecords', () => {
    it('should draw vaccine names and dates', () => {
      const ctx = createMockContext()
      drawVaccineRecords(asCtx(ctx), mockData.vaccines, 400, 750)
      expect(getFillTextCalls(ctx).some(t => t.includes('猫三联'))).toBe(true)
    })

    it('should skip when no vaccines', () => {
      const ctx = createMockContext()
      const nextY = drawVaccineRecords(asCtx(ctx), [], 400, 750)
      expect(nextY).toBe(400)
    })
  })

  describe('drawReportFooter', () => {
    it('should draw disclaimer and generation date', () => {
      const ctx = createMockContext()
      drawReportFooter(asCtx(ctx), mockData.generatedAt, 600, 750)
      expect(getFillTextCalls(ctx).some(t => t.includes('仅供参考'))).toBe(true)
    })
  })

  describe('renderReportToCanvas', () => {
    it('should reject when canvas context not available', async () => {
      vi.mocked(mockTaro.createSelectorQuery).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        fields: vi.fn().mockReturnThis(),
        exec: vi.fn().mockImplementation((cb: (res: any[]) => void) => cb([null])),
      } as any)

      const options: CanvasRenderOptions = { canvasId: 'test-canvas' }
      await expect(renderReportToCanvas(mockData, options)).rejects.toThrow('Canvas context not found')
    })
  })
})
