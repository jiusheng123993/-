import type { ExpressionConfig } from './expressionEngine'
import { getPetFaceDataUri } from './svgRenderer'

export interface SeedreamGenerateParams {
  prompt: string
  imageSize?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'
  negativePrompt?: string
  style?: 'realistic' | 'cartoon' | 'anime'
}

export interface SeedreamGenerateResult {
  success: boolean
  imageUrl?: string
  error?: string
}

export interface PetImageParams {
  species: 'dog' | 'cat'
  expression: ExpressionConfig
  breed?: string
  color?: string
  style?: 'cartoon' | 'realistic'
}

function buildPetPrompt(params: PetImageParams): string {
  const speciesName = params.species === 'dog' ? '狗' : '猫'
  const breedText = params.breed ? `${params.breed}` : ''
  const colorText = params.color ? `${params.color}色` : ''
  const styleText = params.style === 'realistic' ? '写实风格' : '可爱卡通风格'

  return `一只${colorText}${breedText}${speciesName}，${params.expression.label}的表情，${styleText}，高质量，干净背景`
}

export class SeedreamAdapter {
  private useStub: boolean

  constructor(useStub: boolean = true) {
    this.useStub = useStub
  }

  async generatePetImage(params: PetImageParams): Promise<SeedreamGenerateResult> {
    if (this.useStub) {
      return this.generateStubImage(params)
    }

    return this.generateRealImage(params)
  }

  private generateStubImage(params: PetImageParams): SeedreamGenerateResult {
    const dataUri = getPetFaceDataUri(params.expression, params.species, 256)
    return {
      success: true,
      imageUrl: dataUri,
    }
  }

  private async generateRealImage(_params: PetImageParams): Promise<SeedreamGenerateResult> {
    // TODO: 接入 Seedream API
    // const prompt = buildPetPrompt(_params)
    // const result = await seedreamApi.generate({
    //   prompt,
    //   imageSize: 'square',
    //   style: _params.style === 'realistic' ? 'realistic' : 'cartoon',
    // })
    return {
      success: false,
      error: 'Seedream API 尚未接入',
    }
  }

  async generateAchievementImage(
    achievementType: string,
    petName: string,
    species: 'dog' | 'cat'
  ): Promise<SeedreamGenerateResult> {
    if (this.useStub) {
      const expression = await import('./expressionEngine').then(m => m.EXPRESSION_MAP.excited)
      const dataUri = getPetFaceDataUri(expression, species, 256)
      return { success: true, imageUrl: dataUri }
    }

    // TODO: 接入 Seedream API 生成成就卡片
    return {
      success: false,
      error: 'Seedream API 尚未接入',
    }
  }
}

export const seedreamAdapter = new SeedreamAdapter(true)
