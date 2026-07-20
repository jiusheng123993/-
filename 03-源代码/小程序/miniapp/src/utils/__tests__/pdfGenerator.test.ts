import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateHealthReportPDF, downloadPDF } from '../pdfGenerator'
import { HealthReportData } from '../../types/reportTypes'

describe('pdfGenerator', () => {
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw error when element not found', async () => {
    await expect(generateHealthReportPDF(mockData, 'non-existent')).rejects.toThrow(
      'Report preview element not found'
    )
  })

  it('should download PDF', () => {
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

    downloadPDF('data:application/pdf;base64,test', 'health-report.pdf')

    expect(mockLink.href).toBe('data:application/pdf;base64,test')
    expect(mockLink.download).toBe('health-report.pdf')
    expect(mockLink.click).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
