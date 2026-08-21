/**
 * 字段命名风格转换工具测试（camelCase ↔ snake_case）
 */
import { describe, it, expect } from 'vitest'
import { toSnakeCase, toCamelCase } from '../snakeCase'

describe('toSnakeCase', () => {
  it('camelCase 键转为 snake_case', () => {
    expect(toSnakeCase({ avatarPhotoUrl: 'x', breedId: 'b1', avatarCartoonUrl: 'y' })).toEqual({
      avatar_photo_url: 'x',
      breed_id: 'b1',
      avatar_cartoon_url: 'y',
    })
  })

  it('已是 snake_case 的键保持不变（幂等）', () => {
    expect(toSnakeCase({ name: '旺财', birth_date: '2023-01-01' })).toEqual({
      name: '旺财',
      birth_date: '2023-01-01',
    })
  })

  it('连续大写（如 URL）只转首字母前', () => {
    expect(toSnakeCase({ apiUrl: 'x' })).toEqual({ api_url: 'x' })
  })
})

describe('toCamelCase', () => {
  it('snake_case 键转为 camelCase', () => {
    expect(toCamelCase({ avatar_photo_url: 'x', breed_id: 'b1' })).toEqual({
      avatarPhotoUrl: 'x',
      breedId: 'b1',
    })
  })

  it('已是 camelCase 的键保持不变（幂等，服务端返回与本地数据可安全归一化）', () => {
    expect(toCamelCase({ name: '旺财', avatarPhotoUrl: 'x' })).toEqual({
      name: '旺财',
      avatarPhotoUrl: 'x',
    })
  })
})

describe('往返转换', () => {
  it('toSnakeCase → toCamelCase 还原 camelCase 键', () => {
    const original = { avatarPhotoUrl: 'x', isNeutered: true }
    expect(toCamelCase(toSnakeCase(original))).toEqual(original)
  })
})
