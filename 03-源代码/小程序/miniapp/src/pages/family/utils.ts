import type { PetProfile } from '../../services/petService'
import type { PetMoment } from '../../types/familyTypes'

export interface WeeklyReportWithPet {
  petName: string
  score: number
  overallMood: 'excellent' | 'good' | 'fair' | 'concerning'
  summary: string
}

export interface RankedPet {
  pet: PetProfile
  score: number
  rank: number
  role: string
  roleIcon: string
}

export interface QuickEntry {
  icon: string
  label: string
  url: string
}

export const RANK_MEDALS = ['🥇', '🥈', '🥉']

export const ROLE_CONFIG: { role: string; icon: string; check: (index: number, score: number, age: string) => boolean }[] = [
  { role: '老大', icon: '👑', check: (index) => index === 0 },
  { role: '团宠', icon: '💖', check: (index, score) => index >= 1 && score >= 85 },
  { role: '活力之星', icon: '⚡', check: (index, score) => score >= 90 },
  { role: '守护者', icon: '🛡️', check: (index, score) => score >= 80 && score < 90 },
  { role: '乖宝宝', icon: '🌟', check: () => true },
]

export function calcAge(birthDate: string): string {
  if (!birthDate) return '未知'
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months
  if (totalMonths < 12) return `${totalMonths}月`
  const ageYears = Math.floor(totalMonths / 12)
  const remainingMonths = totalMonths % 12
  if (remainingMonths === 0) return `${ageYears}岁`
  return `${ageYears}岁${remainingMonths}月`
}

export function getScoreLevel(score: number): string {
  if (score >= 90) return 'high'
  if (score >= 75) return 'mid'
  return 'low'
}

export function calculateHealthScore(stats: { totalCheckins: number; totalAnomalyDays: number; streak: number }): number {
  if (stats.totalCheckins === 0) return 50
  const anomalyRatio = stats.totalAnomalyDays / Math.max(stats.totalCheckins, 1)
  let score = 100
  score -= anomalyRatio * 60
  score += Math.min(stats.streak * 3, 15)
  score += Math.min(stats.totalCheckins, 10)
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function assignRole(index: number, score: number, age: string): { role: string; icon: string } {
  for (const config of ROLE_CONFIG) {
    if (config.check(index, score, age)) {
      return { role: config.role, icon: config.icon }
    }
  }
  return { role: '乖宝宝', icon: '🌟' }
}

export function buildRankedPets(pets: PetProfile[], petScores: Record<string, number>): RankedPet[] {
  const ranked = pets
    .map((pet, index) => {
      const score = petScores[pet.id] ?? 50
      const age = calcAge(pet.birthDate)
      const { role, icon } = assignRole(index, score, age)
      return { pet, score, rank: 0, role, roleIcon: icon }
    })
    .sort((a, b) => b.score - a.score)

  return ranked.map((item, index) => ({
    ...item,
    rank: index + 1,
  }))
}