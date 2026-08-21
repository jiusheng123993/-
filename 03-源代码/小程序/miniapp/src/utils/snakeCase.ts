/**
 * 字段命名风格转换工具（camelCase ↔ snake_case）
 *
 * 背景：服务端 PUT /api/pets/:id 等接口的 zod schema 只认 snake_case，
 * 前端 PetProfile 等数据结构用 camelCase。提交前转 snake_case、返回后转 camelCase，
 * 保证本地 store / 同步队列里的数据始终是 camelCase，服务端契约始终是 snake_case。
 * 注意：这里只做顶层键的浅转换（与后端 pets.ts 的 toCamelCase 行为一致），
 * 嵌套对象/数组元素不做递归转换（当前数据模型无深层嵌套需求）。
 */

/** camelCase 键 → snake_case（如 avatarPhotoUrl → avatar_photo_url） */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    result[snakeKey] = obj[key]
  }
  return result
}

/** snake_case 键 → camelCase（如 avatar_photo_url → avatarPhotoUrl），对已是 camelCase 的键幂等 */
export function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}
