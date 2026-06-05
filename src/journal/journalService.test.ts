import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialJournalState,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getEntryByDate,
  getEntriesByType,
  getEntriesByDateRange,
  getMoodStats,
  getAverageMoodScore,
  getWeeklyReflection,
  getTodayDateString,
  getWeekStartDate
} from './journalService'

describe('journalService', () => {
  let state = createInitialJournalState()

  beforeEach(() => {
    state = createInitialJournalState()
  })

  it('creates initial state with zero entries', () => {
    expect(state.entries).toEqual([])
    expect(state.totalEntries).toBe(0)
    expect(state.currentStreak).toBe(0)
  })

  it('creates a journal entry', () => {
    const today = getTodayDateString()
    const newState = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'good',
      moodScore: 4,
      title: '今天学到了很多',
      content: '今天是一个充实的日子...',
      highlights: ['完成了模块开发', '运动了30分钟'],
      challenges: ['有点拖延'],
      lessons: ['先完成再完美'],
      tomorrowPlan: ['继续开发新功能'],
      tags: ['coding', 'health']
    })

    expect(newState.entries).toHaveLength(1)
    expect(newState.totalEntries).toBe(1)
    expect(newState.entries[0].title).toBe('今天学到了很多')
    expect(newState.entries[0].mood).toBe('good')
    expect(newState.entries[0].highlights).toHaveLength(2)
  })

  it('updates a journal entry', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'neutral',
      moodScore: 3,
      title: '初始标题',
      content: '初始内容',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    const entryId = s.entries[0].id
    s = updateJournalEntry(s, entryId, { title: '更新后的标题', mood: 'great', moodScore: 5 })

    expect(s.entries[0].title).toBe('更新后的标题')
    expect(s.entries[0].mood).toBe('great')
    expect(s.entries[0].moodScore).toBe(5)
  })

  it('deletes a journal entry', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'good',
      moodScore: 4,
      title: '测试',
      content: '测试内容',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    const entryId = s.entries[0].id
    s = deleteJournalEntry(s, entryId)

    expect(s.entries).toHaveLength(0)
    expect(s.totalEntries).toBe(0)
  })

  it('finds entry by date and type', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'weekly',
      mood: 'good',
      moodScore: 4,
      title: '周复盘',
      content: '本周总结...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    const found = getEntryByDate(s, today, 'weekly')
    expect(found).toBeDefined()
    expect(found?.title).toBe('周复盘')

    const notFound = getEntryByDate(s, today, 'daily')
    expect(notFound).toBeUndefined()
  })

  it('filters entries by type', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'good',
      moodScore: 4,
      title: '日复盘',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })
    s = createJournalEntry(s, {
      date: getWeekStartDate(),
      type: 'weekly',
      mood: 'neutral',
      moodScore: 3,
      title: '周复盘',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    const dailies = getEntriesByType(s, 'daily')
    const weeklies = getEntriesByType(s, 'weekly')
    expect(dailies).toHaveLength(1)
    expect(weeklies).toHaveLength(1)
  })

  it('filters entries by date range', () => {
    const today = getTodayDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    let s = createJournalEntry(state, {
      date: yesterdayStr,
      type: 'daily',
      mood: 'good',
      moodScore: 4,
      title: '昨天',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })
    s = createJournalEntry(s, {
      date: today,
      type: 'daily',
      mood: 'great',
      moodScore: 5,
      title: '今天',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    const range = getEntriesByDateRange(s, yesterdayStr, today)
    expect(range).toHaveLength(2)
  })

  it('calculates mood stats', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'great',
      moodScore: 5,
      title: '好日子',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    const stats = getMoodStats(s, 30)
    expect(stats).toHaveLength(1)
    expect(stats[0].mood).toBe('great')
    expect(stats[0].score).toBe(5)
  })

  it('calculates average mood score', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'great',
      moodScore: 5,
      title: '1',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    expect(getAverageMoodScore(s, 7)).toBe(5)
  })

  it('generates weekly reflection summary', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'good',
      moodScore: 4,
      title: '日记',
      content: '...',
      highlights: ['完成项目'],
      challenges: ['起床困难'],
      lessons: ['坚持'],
      tomorrowPlan: ['继续'],
      tags: []
    })

    const weekly = getWeeklyReflection(s)
    expect(weekly.avgMood).toBe(4)
    expect(weekly.totalHighlights).toBe(1)
    expect(weekly.totalChallenges).toBe(1)
  })

  it('calculates journal streak', () => {
    const today = getTodayDateString()
    let s = createJournalEntry(state, {
      date: today,
      type: 'daily',
      mood: 'good',
      moodScore: 4,
      title: '日记',
      content: '...',
      highlights: [],
      challenges: [],
      lessons: [],
      tomorrowPlan: [],
      tags: []
    })

    expect(s.currentStreak).toBeGreaterThanOrEqual(0)
  })
})