import { createStorageService } from '../data/storageFactory'

export interface ExamScore {
  subject: string
  score: number
  totalScore: number
  targetScore?: number
}

export interface ExamRecord {
  id: string
  name: string
  date: string
  scores: ExamScore[]
  notes?: string
  aiAnalysis?: string
}

export interface ExamStats {
  totalScore: number
  totalMaxScore: number
  averageRate: number
  subjectCount: number
}

export interface ComparisonRow {
  subject: string
  prevScore: number
  prevTotal: number
  currScore: number
  currTotal: number
  change: number
}

export interface ComparisonResult {
  recordA: ExamRecord
  recordB: ExamRecord
  rows: ComparisonRow[]
}

export interface ExamTrackerState {
  records: ExamRecord[]
}

const storage = createStorageService<ExamTrackerState>(
  'xinghuanhai-examtracker-state',
  { records: [] }
)

export function getExamRecords(): ExamRecord[] {
  return storage.load().records
}

export function getExamRecordById(id: string): ExamRecord | undefined {
  return storage.load().records.find((r) => r.id === id)
}

export function addExamRecord(record: Omit<ExamRecord, 'id'>): ExamRecord {
  const state = storage.load()
  const newRecord: ExamRecord = {
    ...record,
    id: crypto.randomUUID(),
  }
  state.records.unshift(newRecord)
  state.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  storage.save(state)
  return newRecord
}

export function updateExamRecord(id: string, updates: Partial<ExamRecord>): ExamRecord | null {
  const state = storage.load()
  const index = state.records.findIndex((r) => r.id === id)
  if (index === -1) return null
  state.records[index] = { ...state.records[index], ...updates }
  storage.save(state)
  return state.records[index]
}

export function deleteExamRecord(id: string): boolean {
  const state = storage.load()
  const index = state.records.findIndex((r) => r.id === id)
  if (index === -1) return false
  state.records.splice(index, 1)
  storage.save(state)
  return true
}

export function getLatestTwoRecords(): [ExamRecord, ExamRecord] | null {
  const records = storage.load().records
  if (records.length < 2) return null
  return [records[0], records[1]]
}

export function getSubjectsFromRecords(): string[] {
  const state = storage.load()
  const subjectSet = new Set<string>()
  for (const record of state.records) {
    for (const score of record.scores) {
      subjectSet.add(score.subject)
    }
  }
  return Array.from(subjectSet).sort()
}

export function getExamStats(record: ExamRecord): ExamStats {
  let totalScore = 0
  let totalMaxScore = 0
  for (const s of record.scores) {
    totalScore += s.score
    totalMaxScore += s.totalScore
  }
  const averageRate = totalMaxScore > 0 ? totalScore / totalMaxScore : 0
  return {
    totalScore,
    totalMaxScore,
    averageRate,
    subjectCount: record.scores.length
  }
}

export function getComparison(recordA: ExamRecord, recordB: ExamRecord): ComparisonResult {
  const allSubjects = new Set<string>()
  recordA.scores.forEach(s => allSubjects.add(s.subject))
  recordB.scores.forEach(s => allSubjects.add(s.subject))

  const rows: ComparisonRow[] = []
  for (const subject of allSubjects) {
    const prev = recordB.scores.find(s => s.subject === subject)
    const curr = recordA.scores.find(s => s.subject === subject)
    if (!prev || !curr) continue
    const prevPct = prev.score / prev.totalScore
    const currPct = curr.score / curr.totalScore
    const change = currPct - prevPct
    rows.push({
      subject,
      prevScore: prev.score,
      prevTotal: prev.totalScore,
      currScore: curr.score,
      currTotal: curr.totalScore,
      change: Math.round(change * 10000) / 100
    })
  }
  rows.sort((a, b) => b.change - a.change)
  return { recordA, recordB, rows }
}