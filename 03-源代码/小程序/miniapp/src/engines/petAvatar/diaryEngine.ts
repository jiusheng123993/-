import type { PetHealthEntry, DiaryTone, DiaryEntry } from '../../types/avatarTypes'

export type { DiaryTone, DiaryEntry }

const DIARY_TEMPLATES: Record<string, DiaryEntry[]> = {
  all_normal: [
    { text: '今天便便很正常，我很舒服~', tone: 'happy', emoji: '💩' },
    { text: '今天精神不错，主人陪我玩了好久！', tone: 'happy', emoji: '🎾' },
    { text: '今天吃得香睡得香，是快乐的一天~', tone: 'happy', emoji: '😋' },
    { text: '一切正常！主人今天给我梳毛了，好舒服~', tone: 'happy', emoji: '✨' },
  ],
  appetite: [
    { text: '今天不太想吃东西，可能天气太热了...', tone: 'tired', emoji: '🥵' },
    { text: '今天的饭不太合胃口，主人别担心~', tone: 'neutral', emoji: '🍚' },
    { text: '胃口不太好，但主人给我开了罐头！', tone: 'neutral', emoji: '🥫' },
  ],
  spirit: [
    { text: '有点懒洋洋的，想多睡一会儿...', tone: 'tired', emoji: '😴' },
    { text: '今天不想动，就让我当一天懒虫吧~', tone: 'tired', emoji: '🛋️' },
    { text: '精神不太好，但主人的摸摸让我很开心', tone: 'neutral', emoji: '🤚' },
  ],
  poop: [
    { text: '今天肚子不太舒服，主人要留意哦...', tone: 'sick', emoji: '🤒' },
    { text: '便便有点稀，可能是昨天吃多了...', tone: 'neutral', emoji: '💩' },
  ],
  weight: [
    { text: '主人说我胖了！该减肥了...', tone: 'neutral', emoji: '⚖️' },
    { text: '体重下降了，主人很担心我', tone: 'sick', emoji: '📉' },
  ],
  exercise: [
    { text: '今天不想运动，让我歇歇吧~', tone: 'tired', emoji: '😮‍💨' },
  ],
  other: [
    { text: '今天有点不太对劲，主人多看看我~', tone: 'sick', emoji: '🤒' },
  ],
  streak_3: [
    { text: '连续3天状态满分！我是健康小标兵~', tone: 'proud', emoji: '⭐' },
  ],
  streak_7: [
    { text: '连续7天打卡！主人好认真，我也要加油！', tone: 'proud', emoji: '🏆' },
  ],
  streak_30: [
    { text: '连续30天！我和主人都是最棒的搭档！', tone: 'proud', emoji: '👑' },
  ],
  birthday: [
    { text: '今天是我的生日！谢谢主人陪我~', tone: 'happy', emoji: '🎂' },
    { text: '又长大一岁了，要更乖才行！', tone: 'happy', emoji: '🎁' },
  ],
  recovery: [
    { text: '今天好多了！谢谢主人的照顾~', tone: 'happy', emoji: '💪' },
    { text: '恢复中！很快就能活蹦乱跳了！', tone: 'happy', emoji: '🏃' },
  ],
  default: [
    { text: '今天也是普通而幸福的一天~', tone: 'happy', emoji: '💕' },
    { text: '有主人在身边，每天都是好日子~', tone: 'happy', emoji: '🏠' },
  ],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateDiaryEntry(
  entry: PetHealthEntry,
  streakDays: number,
  isBirthday: boolean,
  isRecovery: boolean
): DiaryEntry {
  if (isBirthday) {
    return pickRandom(DIARY_TEMPLATES.birthday)
  }

  if (isRecovery) {
    return pickRandom(DIARY_TEMPLATES.recovery)
  }

  if (streakDays >= 30) {
    return pickRandom(DIARY_TEMPLATES.streak_30)
  }

  if (streakDays >= 7) {
    return pickRandom(DIARY_TEMPLATES.streak_7)
  }

  if (streakDays >= 3 && !entry.hasAnomaly) {
    return pickRandom(DIARY_TEMPLATES.streak_3)
  }

  if (entry.hasAnomaly && entry.anomalyItems) {
    for (const anomaly of entry.anomalyItems) {
      if (DIARY_TEMPLATES[anomaly]) {
        return pickRandom(DIARY_TEMPLATES[anomaly])
      }
    }
  }

  if (!entry.hasAnomaly) {
    return pickRandom(DIARY_TEMPLATES.all_normal)
  }

  return pickRandom(DIARY_TEMPLATES.default)
}

export function generateDiaryForToday(
  entry: PetHealthEntry | null,
  streakDays: number,
  isBirthday: boolean,
  isRecovery: boolean
): DiaryEntry {
  if (!entry) {
    return { text: '今天还没打卡呢，主人快来~', tone: 'neutral', emoji: '⏰' }
  }

  return generateDiaryEntry(entry, streakDays, isBirthday, isRecovery)
}
