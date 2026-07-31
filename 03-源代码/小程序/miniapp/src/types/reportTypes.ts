/** 健康报告数据 */
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
  aiAnalysis?: string
}

/** 画布渲染配置 */
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
