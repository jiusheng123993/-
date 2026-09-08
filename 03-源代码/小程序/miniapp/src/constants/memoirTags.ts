/**
 * 回忆录回忆标签（F4 记忆驱动回忆录）
 *
 * 与服务端 `server/src/schemas/index.ts` 的 MEMOIR_TAGS 枚举保持一致（防漂移见 __tests__）：
 * 用户选中的标签会透传给创建接口的 `tags` 字段，服务端按标签筛选记忆引擎核心层记忆
 * （agent_memories）作为分镜叙事素材——兑现"根据你在小程序里的回忆生成回忆录"的卖点。
 */
export interface MemoirTagOption {
  /** 标签 key（与服务端 MEMOIR_TAGS 枚举一致，禁止改动） */
  key: string
  /** 中文展示名 */
  label: string
  /** chip 上的 emoji（纯装饰） */
  emoji: string
}

export const MEMOIR_TAG_OPTIONS: MemoirTagOption[] = [
  { key: 'milestone', label: '里程碑', emoji: '🏁' },
  { key: 'daily_joy', label: '日常欢乐', emoji: '😄' },
  { key: 'bonding', label: '陪伴时光', emoji: '🤝' },
  { key: 'special_day', label: '特别的日子', emoji: '🎂' },
  { key: 'family', label: '全家回忆', emoji: '👨‍👩‍👧' },
  { key: 'health_heal', label: '康复记录', emoji: '💚' },
  { key: 'farewell', label: '告别与思念', emoji: '🕯️' },
  { key: 'seasonal', label: '四季风景', emoji: '🍂' },
]
