export interface TasteModel {
  visualTaste: string
  interactionTaste: string
  productTaste: string
  writingTaste: string
  architectureTaste: string
  unacceptablePatterns: string[]
  updatedAt: string
}

export interface TasteModelInput {
  visualTaste?: string
  interactionTaste?: string
  productTaste?: string
  writingTaste?: string
  architectureTaste?: string
  unacceptablePatterns?: string[]
}

const DEFAULT_TASTE_MODEL: TasteModel = {
  visualTaste: '',
  interactionTaste: '',
  productTaste: '',
  writingTaste: '',
  architectureTaste: '',
  unacceptablePatterns: [],
  updatedAt: ''
}

export function createTasteModel(input?: TasteModelInput): TasteModel {
  return {
    visualTaste: input?.visualTaste ?? DEFAULT_TASTE_MODEL.visualTaste,
    interactionTaste: input?.interactionTaste ?? DEFAULT_TASTE_MODEL.interactionTaste,
    productTaste: input?.productTaste ?? DEFAULT_TASTE_MODEL.productTaste,
    writingTaste: input?.writingTaste ?? DEFAULT_TASTE_MODEL.writingTaste,
    architectureTaste: input?.architectureTaste ?? DEFAULT_TASTE_MODEL.architectureTaste,
    unacceptablePatterns: input?.unacceptablePatterns ?? [...DEFAULT_TASTE_MODEL.unacceptablePatterns],
    updatedAt: new Date().toISOString()
  }
}

export function updateTasteModel(
  model: TasteModel,
  patch: Partial<TasteModelInput>
): TasteModel {
  return {
    ...model,
    ...patch,
    updatedAt: new Date().toISOString()
  }
}

export function addUnacceptablePattern(
  model: TasteModel,
  pattern: string
): TasteModel {
  if (model.unacceptablePatterns.includes(pattern)) {
    return model
  }
  return {
    ...model,
    unacceptablePatterns: [...model.unacceptablePatterns, pattern],
    updatedAt: new Date().toISOString()
  }
}

export function summarizeTasteModel(model: TasteModel): string {
  const parts: string[] = []
  if (model.visualTaste) parts.push(`视觉品味: ${model.visualTaste}`)
  if (model.interactionTaste) parts.push(`交互品味: ${model.interactionTaste}`)
  if (model.productTaste) parts.push(`产品品味: ${model.productTaste}`)
  if (model.writingTaste) parts.push(`写作品味: ${model.writingTaste}`)
  if (model.architectureTaste) parts.push(`架构品味: ${model.architectureTaste}`)
  if (model.unacceptablePatterns.length > 0) {
    parts.push(`不可接受模式: ${model.unacceptablePatterns.join(', ')}`)
  }
  return parts.join('; ')
}
