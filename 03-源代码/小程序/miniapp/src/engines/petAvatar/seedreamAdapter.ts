import Taro from '@tarojs/taro'
import type { ExpressionConfig, PetSpecies, SeedreamGenerateParams, SeedreamGenerateResult, PetImageParams } from '../../types/avatarTypes'

export type { SeedreamGenerateParams, SeedreamGenerateResult, PetImageParams }

import { getPetFaceDataUri } from './svgRenderer'
import { EXPRESSION_MAP } from './expressionEngine'
import { getEdgeFunctionUrl } from '../../config/supabase'

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

    try {
      const result = await this.generateRealImage(params)
      if (!result.success) {
        return this.generateStubImage(params)
      }
      return result
    } catch {
      return this.generateStubImage(params)
    }
  }

  private generateStubImage(params: PetImageParams): SeedreamGenerateResult {
    const dataUri = getPetFaceDataUri(params.expression, params.species, 256)
    return {
      success: true,
      imageUrl: dataUri,
    }
  }

  private async generateRealImage(params: PetImageParams): Promise<SeedreamGenerateResult> {
    const prompt = buildPetPrompt(params)
    const apiParams: SeedreamGenerateParams = {
      prompt,
      imageSize: 'square',
      negativePrompt: '低质量, 模糊, 变形, 多余肢体, 文字, 水印',
      style: params.style === 'realistic' ? 'realistic' : 'cartoon',
    }

    const token = Taro.getStorageSync('xhh_token')
    const res = await Taro.request({
      url: getEdgeFunctionUrl('pet-avatar-generate'),
      method: 'POST',
      data: apiParams,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    })

    if (res.statusCode === 200) {
      const data = res.data as { success: boolean; imageUrl?: string; error?: string }
      if (data.success && data.imageUrl) {
        return { success: true, imageUrl: data.imageUrl }
      }
      return { success: false, error: data.error || '生成失败' }
    }

    if (res.statusCode === 402) {
      return { success: false, error: '生成次数已用完' }
    }

    if (res.statusCode === 429) {
      return { success: false, error: '请求过于频繁，请稍后再试' }
    }

    return { success: false, error: `请求失败: ${res.statusCode}` }
  }

  async generateAchievementImage(
    achievementType: string,
    petName: string,
    species: PetSpecies
  ): Promise<SeedreamGenerateResult> {
    if (this.useStub) {
      const expression = EXPRESSION_MAP.excited
      const dataUri = getPetFaceDataUri(expression, species, 256)
      return { success: true, imageUrl: dataUri }
    }

    try {
      const prompt = `${petName}获得${achievementType}成就，庆祝场景，可爱卡通风格，高质量`
      const apiParams: SeedreamGenerateParams = {
        prompt,
        imageSize: 'square',
        style: 'cartoon',
      }

      const token = Taro.getStorageSync('xhh_token')
      const res = await Taro.request({
        url: getEdgeFunctionUrl('pet-avatar-generate'),
        method: 'POST',
        data: apiParams,
        header: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        timeout: 30000,
      })

      if (res.statusCode === 200) {
        const data = res.data as { success: boolean; imageUrl?: string; error?: string }
        if (data.success && data.imageUrl) {
          return { success: true, imageUrl: data.imageUrl }
        }
      }

      const expression = EXPRESSION_MAP.excited
      const dataUri = getPetFaceDataUri(expression, species, 256)
      return { success: true, imageUrl: dataUri }
    } catch {
      const expression = EXPRESSION_MAP.excited
      const dataUri = getPetFaceDataUri(expression, species, 256)
      return { success: true, imageUrl: dataUri }
    }
  }
}

const shouldUseStub = !(process.env.TARO_APP_API_BASE_URL)

export const seedreamAdapter = new SeedreamAdapter(shouldUseStub)
