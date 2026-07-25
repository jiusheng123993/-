import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { useFamilyStore } from '../../stores/familyStore'
import { getCheckinStats } from '../../services/checkinService'
import { getFamilyMoments, getNewMoments } from '../../services/momentService'
import { generateWeeklyReport, generateFamilyWeeklySummary } from '../../services/weeklyReportService'
import type { WeeklyReport } from '../../services/weeklyReportService'
import type { PetMoment } from '../../types/familyTypes'
import type { PetProfile } from '../../services/petService'
import { useThemeClass } from '../../hooks/useThemeClass'
import { usePolling } from '../../hooks/usePolling'
import { calculateHealthScore, buildRankedPets, type WeeklyReportWithPet, type QuickEntry } from './utils'
import FamilyReport from './FamilyReport'
import FamilyRanking from './FamilyRanking'
import FamilyMoments from './FamilyMoments'
import FamilyPetList from './FamilyPetList'
import FamilyQuickGrid from './FamilyQuickGrid'
import './index.scss'

const QUICK_ENTRIES: QuickEntry[] = [
  { icon: '🧬', label: '家族图谱', url: '/pagesPet/family/lineage/index' },
  { icon: '📅', label: '家庭日历', url: '/pagesPet/family/calendar/index' },
  { icon: '📷', label: '全家福', url: '/pagesPet/family/dashboard/index' },
]

export default function FamilyPage() {
  const { pets, fetchPets, switchPet } = usePetStore()
  const { currentFamily, fetchFamilies } = useFamilyStore()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const [pageReady, setPageReady] = useState(false)
  const [petScores, setPetScores] = useState<Record<string, number>>({})
  const [moments, setMoments] = useState<PetMoment[]>([])
  const [newMomentsCount, setNewMomentsCount] = useState(0)
  const [showNewMoments, setShowNewMoments] = useState(false)
  const lastMomentTimeRef = useRef<string>('')
  const [weeklyReport, setWeeklyReport] = useState<{
    summary: string
    overallMood: WeeklyReport['overallMood']
    highlights: string[]
    concerns: string[]
    reports: WeeklyReportWithPet[]
  } | null>(null)
  const themeClass = useThemeClass()

  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated || !user) {
      const pages = Taro.getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.route !== 'pages/login/index') {
        Taro.reLaunch({ url: '/pages/login/index' })
      }
      return
    }
    const loadData = async () => {
      await fetchFamilies()
      await fetchPets(user.id)
      const fetchedPets = usePetStore.getState().pets
      const scores: Record<string, number> = {}
      const petReports: WeeklyReportWithPet[] = []

      for (const pet of fetchedPets) {
        try {
          const stats = await getCheckinStats(pet.id, user.id)
          scores[pet.id] = calculateHealthScore(stats)

          const report = generateWeeklyReport({
            petName: pet.name,
            species: pet.species,
            breed: pet.breed,
            score: scores[pet.id],
            scoreTrend: 'stable',
            checkinDays: stats.weeklyCount,
            anomalyDays: stats.totalAnomalyDays,
            streak: stats.streak,
            recentMoments: [],
          })
          petReports.push({ petName: pet.name, score: scores[pet.id], overallMood: report.overallMood, summary: report.summary })
        } catch {
          scores[pet.id] = 50
        }
      }
      setPetScores(scores)

      if (petReports.length > 0) {
        const familySummary = generateFamilyWeeklySummary(
          petReports.map(r => ({
            title: '',
            summary: r.summary,
            overallMood: r.overallMood,
            highlights: [],
            concerns: [],
            suggestions: [],
          })),
          fetchedPets.length
        )
        setWeeklyReport({
          summary: familySummary.summary,
          overallMood: familySummary.overallMood,
          highlights: familySummary.highlights,
          concerns: familySummary.concerns,
          reports: petReports,
        })
      }

      try {
        const familyId = useFamilyStore.getState().currentFamily?.id || 'fam_001'
        const familyMoments = await getFamilyMoments(familyId, 5)
        setMoments(familyMoments)
        if (familyMoments.length > 0) {
          lastMomentTimeRef.current = familyMoments[0].createdAt
        }
      } catch {
        setMoments([])
      }

      setPageReady(true)
    }
    loadData()
  }, [isInitialized, isAuthenticated, user])

  const rankedPets = useMemo(() => buildRankedPets(pets, petScores), [pets, petScores])

  const pollNewMoments = useCallback(async () => {
    const familyId = useFamilyStore.getState().currentFamily?.id || 'fam_001'
    const since = lastMomentTimeRef.current
    if (!since) return
    try {
      const newMoments = await getNewMoments(familyId, since)
      if (newMoments.length > 0) {
        setNewMomentsCount(prev => prev + newMoments.length)
        setShowNewMoments(true)
      }
    } catch {
      // 静默失败，轮询不打断用户
    }
  }, [])

  usePolling(pollNewMoments, {
    intervalMs: 30000,
    enabled: pageReady,
    immediateOnResume: true,
  })

  const handleLoadNewMoments = useCallback(async () => {
    const familyId = useFamilyStore.getState().currentFamily?.id || 'fam_001'
    try {
      const latestMoments = await getFamilyMoments(familyId, 5)
      setMoments(latestMoments)
      if (latestMoments.length > 0) {
        lastMomentTimeRef.current = latestMoments[0].createdAt
      }
      setNewMomentsCount(0)
      setShowNewMoments(false)
    } catch {
      // 静默处理
    }
  }, [])

  const handlePetClick = async (pet: PetProfile) => {
    await switchPet(pet.id)
    Taro.switchTab({ url: '/pages/pet-profile/index' })
  }

  const handleAddPet = () => {
    Taro.navigateTo({ url: '/pagesPet/add/index' })
  }

  if (!pageReady) {
    return (
      <View className={`family-page ${themeClass}`}>
        <View className='family-loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className={`family-page ${themeClass}`} scrollY>
      <View className='family-header'>
        <Text className='family-header-title'>🏠 星澜小筑</Text>
        <Text className='family-header-sub'>
          <Text className='family-header-count'>{pets.length}位</Text>家人
        </Text>
      </View>

      {pets.length > 0 && weeklyReport && (
        <FamilyReport weeklyReport={weeklyReport} pets={pets} />
      )}

      <FamilyRanking rankedPets={rankedPets} />

      {showNewMoments && newMomentsCount > 0 && (
        <View className='family-new-moments-bar' onClick={handleLoadNewMoments}>
          <Text className='family-new-moments-dot' />
          <Text className='family-new-moments-text'>{newMomentsCount}条新动态</Text>
          <Text className='family-new-moments-arrow'>查看 ▸</Text>
        </View>
      )}

      <FamilyMoments moments={moments} />

      <FamilyPetList
        pets={pets}
        petScores={petScores}
        rankedPets={rankedPets}
        onPetClick={handlePetClick}
        onAddPet={handleAddPet}
      />

      <FamilyQuickGrid entries={QUICK_ENTRIES} />

      <View className='family-bottom-safe' />
    </ScrollView>
  )
}