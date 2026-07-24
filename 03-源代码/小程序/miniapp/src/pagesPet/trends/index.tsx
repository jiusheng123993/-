import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useDidShow } from '@tarojs/taro'
import { useThemeClass } from '../../hooks/useThemeClass'
import { logger } from '../../logger'
import PetSwitcher from '../../components/PetSwitcher'
import PaywallPopup from '../../components/PaywallPopup'
import AnomalyMarker from '../../components/AnomalyMarker'
import PageLoading from '../../components/PageLoading'
import PageError from '../../components/PageError'
import { PetAvatar } from '../../components'
import HealthReportPreview from '../../components/HealthReportPreview'
import HealthTrendShareCard from '../../components/HealthTrendShareCard'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { useShareStore } from '../../stores/shareStore'
import { useTrend } from '../../hooks/useTrend'
import { useMembership } from '../../hooks/useMembership'
import { generateHealthReportData, downloadHealthReport, shareHealthReport, downloadHealthReportCsv, shareReportToVet } from '../services/healthReportPdfService'
import { recordShare } from '../../services/shareService'
import type { ExpressionContext } from '../../engines/petAvatar'
import type { TrendDataPoint, TrendSummary, MonthlyReport } from '../../services/trendService'
import type { HealthReportData } from '../../types/reportTypes'
import type { HealthTrendShareData } from '../../types/shareTypes'
import { checkNpsEligibility, submitNpsResponse, dismissNpsSurvey } from '../../services/npsService'
import NpsSurvey from '../../components/NpsSurvey'
import type { NpsTriggerEvent } from '../../types/npsTypes'
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { BREED_DATA } from '../../data/petKnowledge/breeds'
import { useAnalytics, usePageView } from '../../hooks/useAnalytics'
import { AnalyticsEventName } from '../../types/analyticsTypes'
import './index.scss'

type TimeRange = 'week' | 'month' | 'quarter'
type TrendTab = 'weight' | 'appetite' | 'stool' | 'summary'

const TIME_RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'week', label: '近1周' },
  { key: 'month', label: '近1月' },
  { key: 'quarter', label: '近3月' }
]

const TREND_TABS: { key: TrendTab; label: string }[] = [
  { key: 'weight', label: '体重' },
  { key: 'appetite', label: '食欲' },
  { key: 'stool', label: '便便' },
  { key: 'summary', label: '综合' }
]

const APPETITE_LABELS: Record<string, string> = {
  normal: '正常',
  decreased: '减少',
  increased: '增加',
  none: '不吃'
}

const STOOL_LABELS: Record<string, string> = {
  normal: '正常',
  soft: '偏软',
  diarrhea: '腹泻',
  constipation: '便秘',
  bloody: '便血'
}

const APPETITE_COLORS: Record<string, string> = {
  normal: '#52C41A',
  decreased: '#FAAD14',
  increased: '#FF8C42',
  none: '#FF4D4F'
}

const STOOL_COLORS: Record<string, string> = {
  normal: '#52C41A',
  soft: '#FAAD14',
  diarrhea: '#FF8C42',
  constipation: '#FAAD14',
  bloody: '#FF4D4F'
}

const RISK_COLORS: Record<string, string> = {
  normal: '#52C41A',
  caution: '#FAAD14',
  warning: '#FF8C42',
  emergency: '#FF4D4F'
}

function getAbnormalItems(point: TrendDataPoint): string[] {
  const items: string[] = []
  if (point.appetite && point.appetite !== 'normal') {
    items.push(`食欲${APPETITE_LABELS[point.appetite]}`)
  }
  if (point.stool && point.stool !== 'normal') {
    items.push(`便便${STOOL_LABELS[point.stool]}`)
  }
  if (point.vomiting) {
    items.push('呕吐')
  }
  if (point.hasAbnormal && items.length === 0) {
    items.push('数据异常')
  }
  return items
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`
  }
  return dateStr
}

function getMonthStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function PetTrendsPage() {
  useShareAppMessage(() => ({
    title: '星寰海 - 宠物健康趋势',
    path: `/pagesPet/trends/index${inviteCode ? `?inviteCode=${inviteCode}` : ''}`,
  }))
  useShareTimeline(() => ({
    title: '星寰海 - 宠物健康趋势',
    query: inviteCode ? `inviteCode=${inviteCode}` : '',
  }))

  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown } = useMembership()
  const user = useAuthStore(s => s.user)
  const inviteCode = useShareStore(s => s.inviteCode)
  const {
    trendData,
    summary,
    monthlyReport,
    isLoading,
    error,
    fetchWeightTrend,
    fetchAppetiteTrend,
    fetchStoolTrend,
    fetchSummary,
    fetchMonthlyReport,
    clearError
  } = useTrend()

  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [activeTab, setActiveTab] = useState<TrendTab>('weight')
  const [paywallVisible, setPaywallVisible] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<HealthReportData | null>(null)
  const [showTrendShare, setShowTrendShare] = useState(false)
  const [trendShareData, setTrendShareData] = useState<HealthTrendShareData | null>(null)
  const [showNpsSurvey, setShowNpsSurvey] = useState(false)
  const [npsTriggerEvent, setNpsTriggerEvent] = useState<NpsTriggerEvent>('manual')
  const { trackPageView, trackEvent } = useAnalytics()

  const disclaimerText = new MedicalDisclaimer().getTrendDisclaimer()

  usePageView('trends')

  useDidShow(() => {
    if (user) fetchPets(user.id)
  })

  useEffect(() => {
    if (currentPet?.id) {
      loadTrendData()
    }
  }, [currentPet?.id, timeRange, activeTab])

  const loadTrendData = useCallback(async () => {
    if (!currentPet?.id) return
    clearError()

    const monthsMap: Record<TimeRange, number> = { week: 1, month: 1, quarter: 3 }

    switch (activeTab) {
      case 'weight':
        await fetchWeightTrend(currentPet.id, monthsMap[timeRange])
        break
      case 'appetite':
        await fetchAppetiteTrend(currentPet.id, monthsMap[timeRange])
        break
      case 'stool':
        await fetchStoolTrend(currentPet.id, monthsMap[timeRange])
        break
      case 'summary':
        await fetchSummary(currentPet.id, timeRange)
        await fetchMonthlyReport(currentPet.id, getMonthStr(new Date()))
        break
    }
  }, [currentPet?.id, timeRange, activeTab, clearError, fetchWeightTrend, fetchAppetiteTrend, fetchStoolTrend, fetchSummary, fetchMonthlyReport])

  const handlePetSwitch = useCallback((petId: string) => {
    switchPet(petId)
  }, [switchPet])

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    if (!isMember && (range === 'month' || range === 'quarter')) {
      trackEvent('show_paywall', { feature: 'trends_time_range' })
      setPaywallVisible(true)
      return
    }
    trackEvent('change_time_range', { range })
    setTimeRange(range)
  }, [isMember])

  const handleTabChange = useCallback((tab: TrendTab) => {
    setActiveTab(tab)
  }, [])

  const handleExportReport = useCallback(async () => {
    if (!currentPet?.id || !user?.id) return

    const hasAccess = checkAccess('health_report_export')
    if (!hasAccess) {
      trackEvent('show_paywall', { feature: 'health_report_export' })
      setPaywallVisible(true)
      return
    }
    trackEvent('click_export_report')

    setGenerating(true)
    try {
      const reportData = await generateHealthReportData(user.id, currentPet.id)
      await downloadHealthReport(reportData, currentPet.name)
      const npsStatus = checkNpsEligibility(user.id, user.createdAt || new Date().toISOString())
      if (npsStatus.isEligible) {
        setShowNpsSurvey(true)
        setNpsTriggerEvent('after_export')
      }
    } catch (error) {
      logger.error('Trends', 'Failed to generate report', error)
      Taro.showToast({ title: '导出报告失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }, [currentPet, user, checkAccess])

  const handlePreviewReport = useCallback(async () => {
    if (!currentPet?.id || !user?.id) return

    const hasAccess = checkAccess('health_report_export')
    if (!hasAccess) {
      trackEvent('show_paywall', { feature: 'health_report_preview' })
      setPaywallVisible(true)
      return
    }

    setGenerating(true)
    try {
      const reportData = await generateHealthReportData(user.id, currentPet.id)
      setReportData(reportData)
      setShowReport(true)
    } catch (error) {
      logger.error('Trends', 'Failed to preview report', error)
      Taro.showToast({ title: '预览报告失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }, [currentPet, user, checkAccess])

  const handleShareTrend = useCallback(() => {
    if (!currentPet || !summary) return
    setTrendShareData({
      petName: currentPet.name,
      petAvatar: currentPet.avatarPhotoUrl || '',
      dateRange: `${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')} - ${new Date().toLocaleDateString('zh-CN')}`,
      trendSummary: summary.aiAnalysis || '暂无趋势数据',
      aiInsight: summary.weightChangePercent > 0 ? '体重上升趋势' : summary.weightChangePercent < 0 ? '体重下降趋势' : '体重稳定',
    })
    setShowTrendShare(true)
  }, [currentPet, summary])

  const handleExportCsv = useCallback(async () => {
    if (!currentPet?.id || !user?.id) return

    const hasAccess = checkAccess('health_report_export')
    if (!hasAccess) {
      trackEvent('show_paywall', { feature: 'health_report_export' })
      setPaywallVisible(true)
      return
    }
    trackEvent('click_export_csv')

    setGenerating(true)
    try {
      const reportData = await generateHealthReportData(user.id, currentPet.id)
      await downloadHealthReportCsv(reportData, currentPet.name)
    } catch (error) {
      logger.error('Trends', 'Failed to export CSV', error)
      Taro.showToast({ title: '导出CSV失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }, [currentPet, user, checkAccess])

  const handleShareToVet = useCallback(async () => {
    if (!currentPet?.id || !user?.id) return

    const hasAccess = checkAccess('health_report_export')
    if (!hasAccess) {
      trackEvent('show_paywall', { feature: 'health_report_export' })
      setPaywallVisible(true)
      return
    }
    trackEvent('click_share_to_vet')

    setGenerating(true)
    try {
      const reportData = await generateHealthReportData(user.id, currentPet.id)
      await shareReportToVet(reportData, currentPet.name)
    } catch (error) {
      logger.error('Trends', 'Failed to share to vet', error)
      Taro.showToast({ title: '分享给兽医失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }, [currentPet, user, checkAccess])

  const handleTrendShareConfirm = useCallback(() => {
    if (!user?.id || !currentPet?.id) return
    trackEvent(AnalyticsEventName.ShareAction, { type: 'trend', platform: 'wechat' })
    Taro.showShareMenu({ withShareTicket: true })
    recordShare(user.id, 'health_trend', currentPet.id, 'wechat')
    setShowTrendShare(false)
  }, [user?.id, currentPet?.id, trackEvent])

  const handleTrendShareClose = useCallback(() => {
    setShowTrendShare(false)
  }, [])

  const breedWeightRange = useMemo(() => {
    if (!currentPet?.breedId) return null
    const breed = BREED_DATA.find((b) => b.id === currentPet.breedId)
    if (!breed) return null
    return { min: breed.weightRange.min, max: breed.weightRange.max, name: breed.name }
  }, [currentPet?.breedId])

  const weightChartData = useMemo(() => {
    if (activeTab !== 'weight') return null
    const withWeight = trendData.filter((d) => d.weight !== undefined && d.weight !== null)
    if (withWeight.length === 0) return null
    const weights = withWeight.map((d) => d.weight!)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const range = maxWeight - minWeight || 1
    return {
      points: withWeight,
      minWeight,
      maxWeight,
      range
    }
  }, [trendData, activeTab])

  const breedWeightAnalysis = useMemo(() => {
    if (!breedWeightRange || !weightChartData || weightChartData.points.length === 0) return null
    const latestWeight = weightChartData.points[weightChartData.points.length - 1]?.weight
    if (latestWeight === undefined) return null

    const { min, max, name } = breedWeightRange
    const mid = (min + max) / 2
    const deviation = latestWeight - mid
    const deviationPercent = (deviation / mid) * 100

    let status: 'underweight' | 'normal' | 'overweight' | 'obese'
    let suggestion: string

    if (latestWeight < min) {
      status = 'underweight'
      suggestion = `低于${name}标准体重下限${min}kg，建议增加营养摄入并排查潜在健康问题`
    } else if (latestWeight > max) {
      const overPercent = ((latestWeight - max) / max) * 100
      if (overPercent > 20) {
        status = 'obese'
        suggestion = `严重超重，超出${name}标准上限${max}kg的${overPercent.toFixed(0)}%，建议立即制定减重计划`
      } else {
        status = 'overweight'
        suggestion = `超出${name}标准体重上限${max}kg，建议控制饮食增加运动`
      }
    } else {
      status = 'normal'
      suggestion = `在${name}标准体重范围${min}-${max}kg内，继续保持`
    }

    return { status, suggestion, deviation, deviationPercent, latestWeight, min, max, mid }
  }, [breedWeightRange, weightChartData])

  const breedWeightTrend = useMemo(() => {
    if (!breedWeightRange || !weightChartData || weightChartData.points.length < 3) return null
    const points = weightChartData.points
    const recent = points.slice(-3)
    const first = recent[0].weight!
    const last = recent[recent.length - 1].weight!
    const change = last - first
    const changePercent = (change / first) * 100

    let direction: 'stable' | 'increasing' | 'decreasing'
    if (Math.abs(changePercent) < 2) {
      direction = 'stable'
    } else if (changePercent > 0) {
      direction = 'increasing'
    } else {
      direction = 'decreasing'
    }

    return { direction, change, changePercent, first, last }
  }, [breedWeightRange, weightChartData])

  const appetiteChartData = useMemo(() => {
    if (activeTab !== 'appetite') return null
    if (trendData.length === 0) return null
    return trendData
  }, [trendData, activeTab])

  const stoolChartData = useMemo(() => {
    if (activeTab !== 'stool') return null
    if (trendData.length === 0) return null
    return trendData
  }, [trendData, activeTab])

  const abnormalDays = useMemo(() => {
    return trendData.filter((d) => d.hasAbnormal)
  }, [trendData])

  const abnormalDateSet = useMemo(() => {
    return new Set(abnormalDays.map((d) => d.date))
  }, [abnormalDays])

  const expressionContext = useMemo((): ExpressionContext | null => {
    if (!currentPet) return null
    return {
      todayEntry: null,
      hasAnomaly: abnormalDays.length > 0,
      anomalyCount: abnormalDays.length,
      riskLevel: abnormalDays.length >= 3 ? 'high' : abnormalDays.length > 0 ? 'medium' : null,
      streakDays: summary?.totalDays || 0,
      isBirthday: false,
      isVaccineComplete: false,
      isRecovery: false,
      isDeceased: currentPet.isDeceased || false,
    }
  }, [currentPet, abnormalDays, summary])

  const renderWeightChart = () => {
    if (!weightChartData || weightChartData.points.length === 0) {
      return (
        <View className='trend-chart__empty'>
          <Text className='trend-chart__empty-text'>暂无体重数据</Text>
          <Text className='trend-chart__empty-hint'>打卡时记录体重即可生成趋势图</Text>
        </View>
      )
    }

    const { points, minWeight, maxWeight, range } = weightChartData
    const chartHeight = 320
    const chartWidth = 100
    const paddingTop = 20
    const paddingBottom = 40
    const drawHeight = chartHeight - paddingTop - paddingBottom

    const displayMin = breedWeightRange ? Math.min(minWeight, breedWeightRange.min) : minWeight
    const displayMax = breedWeightRange ? Math.max(maxWeight, breedWeightRange.max) : maxWeight
    const displayRange = displayMax - displayMin || 1

    const latestWeight = points[points.length - 1]?.weight
    const isOverWeight = breedWeightRange && latestWeight !== undefined
      ? latestWeight > breedWeightRange.max
      : false
    const isUnderWeight = breedWeightRange && latestWeight !== undefined
      ? latestWeight < breedWeightRange.min
      : false
    const isOutOfRange = isOverWeight || isUnderWeight

    const breedRangeTopY = paddingTop + ((displayMax - breedWeightRange!.max) / displayRange) * drawHeight
    const breedRangeBottomY = paddingTop + ((displayMax - breedWeightRange!.min) / displayRange) * drawHeight

    return (
      <View className='trend-chart__container'>
        {breedWeightRange && (
          <View className='trend-chart__breed-range-header'>
            <Text className='trend-chart__breed-range-label'>
              {breedWeightRange.name}标准体重范围
            </Text>
            <Text className={`trend-chart__breed-range-value${isOutOfRange ? ' trend-chart__breed-range-value--warning' : ''}`}>
              {breedWeightRange.min} ~ {breedWeightRange.max} kg
            </Text>
            {isOutOfRange && (
              <Text className='trend-chart__breed-range-warning'>
                {isOverWeight ? '当前超重' : '当前偏轻'}
              </Text>
            )}
          </View>
        )}

        {/* 品种体重分析卡片 */}
        {breedWeightAnalysis && (
          <View className={`trend-chart__breed-analysis trend-chart__breed-analysis--${breedWeightAnalysis.status}`}>
            <View className='trend-chart__breed-analysis-header'>
              <Text className='trend-chart__breed-analysis-title'>
                {breedWeightAnalysis.status === 'normal' ? '✅ 体重正常' :
                 breedWeightAnalysis.status === 'underweight' ? '⚠️ 体重偏轻' :
                 breedWeightAnalysis.status === 'overweight' ? '⚠️ 体重偏重' :
                 '🔴 严重超重'}
              </Text>
              <Text className='trend-chart__breed-analysis-value'>
                {breedWeightAnalysis.latestWeight}kg / {breedWeightAnalysis.min}-{breedWeightAnalysis.max}kg
              </Text>
            </View>
            <Text className='trend-chart__breed-analysis-suggestion'>
              {breedWeightAnalysis.suggestion}
            </Text>
            {breedWeightTrend && (
              <View className='trend-chart__breed-trend'>
                <Text className='trend-chart__breed-trend-label'>
                  近期趋势（近3次）：
                </Text>
                <Text className={`trend-chart__breed-trend-value trend-chart__breed-trend-value--${breedWeightTrend.direction}`}>
                  {breedWeightTrend.direction === 'stable' ? '稳定' :
                   breedWeightTrend.direction === 'increasing' ? `上升 ${breedWeightTrend.changePercent.toFixed(1)}%` :
                   `下降 ${Math.abs(breedWeightTrend.changePercent).toFixed(1)}%`}
                </Text>
              </View>
            )}
          </View>
        )}
        <View className='trend-chart__y-axis'>
          <Text className='trend-chart__y-label'>{displayMax.toFixed(1)}kg</Text>
          <Text className='trend-chart__y-label'>{((displayMax + displayMin) / 2).toFixed(1)}kg</Text>
          <Text className='trend-chart__y-label'>{displayMin.toFixed(1)}kg</Text>
        </View>
        <View className='trend-chart__plot-area'>
          <View className='trend-chart__grid'>
            <View className='trend-chart__grid-line' />
            <View className='trend-chart__grid-line' />
            <View className='trend-chart__grid-line' />
          </View>
          <View className='trend-chart__line-chart' style={{ height: `${chartHeight}rpx` }}>
            {breedWeightRange && (
              <View
                className='trend-chart__breed-range-zone'
                style={{
                  top: `${breedRangeTopY}rpx`,
                  height: `${breedRangeBottomY - breedRangeTopY}rpx`
                }}
              >
                <View className='trend-chart__breed-range-line trend-chart__breed-range-line--top' />
                <View className='trend-chart__breed-range-line trend-chart__breed-range-line--bottom' />
              </View>
            )}
            {points.map((point, index) => {
              const x = (index / (points.length - 1 || 1)) * chartWidth
              const y = paddingTop + ((displayMax - point.weight!) / displayRange) * drawHeight
              const isAbnormal = abnormalDateSet.has(point.date)
              const pointOutOfRange = breedWeightRange
                && (point.weight! > breedWeightRange.max || point.weight! < breedWeightRange.min)
              return (
                <View
                  key={point.date}
                  className={`trend-chart__data-point${pointOutOfRange ? ' trend-chart__data-point--out-of-range' : ''}`}
                  style={{
                    left: `${x}%`,
                    bottom: `${chartHeight - y}rpx`
                  }}
                >
                  <View className={`trend-chart__dot${pointOutOfRange ? ' trend-chart__dot--out-of-range' : ''}`} />
                  <Text className={`trend-chart__point-value${pointOutOfRange ? ' trend-chart__point-value--out-of-range' : ''}`}>
                    {point.weight}kg
                  </Text>
                  {isAbnormal && (
                    <AnomalyMarker
                      date={point.date}
                      riskLevel={(point.riskLevel || 'caution') as 'normal' | 'caution' | 'warning' | 'emergency'}
                      items={getAbnormalItems(point)}
                      position={{ x: 0, y: 0 }}
                    />
                  )}
                </View>
              )
            })}
            {points.length > 1 && (
              <svg
                className='trend-chart__svg-line'
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio='none'
              >
                <polyline
                  points={points
                    .map((point, index) => {
                      const x = (index / (points.length - 1 || 1)) * chartWidth
                      const y = paddingTop + ((displayMax - point.weight!) / displayRange) * drawHeight
                      return `${x},${y}`
                    })
                    .join(' ')}
                  fill='none'
                  stroke='#FF8C42'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            )}
          </View>
          <View className='trend-chart__x-axis'>
            {points.map((point) => (
              <Text key={point.date} className='trend-chart__x-label'>
                {formatDateLabel(point.date)}
              </Text>
            ))}
          </View>
        </View>
      </View>
    )
  }

  const renderAppetiteChart = () => {
    if (!appetiteChartData || appetiteChartData.length === 0) {
      return (
        <View className='trend-chart__empty'>
          <Text className='trend-chart__empty-text'>暂无食欲数据</Text>
          <Text className='trend-chart__empty-hint'>打卡时记录食欲即可生成趋势图</Text>
        </View>
      )
    }

    return (
      <View className='trend-chart__container'>
        <View className='trend-chart__bar-chart'>
          {appetiteChartData.map((point) => (
            <View key={point.date} className={`trend-chart__bar-item${abnormalDateSet.has(point.date) ? ' trend-chart__bar-item--abnormal' : ''}`}>
              <View className='trend-chart__bar-wrap'>
                <View
                  className='trend-chart__bar'
                  style={{
                    height: '100%',
                    backgroundColor: APPETITE_COLORS[point.appetite || 'normal'] || '#52C41A'
                  }}
                />
                {abnormalDateSet.has(point.date) && <View className='trend-chart__bar-mark' />}
              </View>
              <Text className='trend-chart__bar-label'>
                {APPETITE_LABELS[point.appetite || 'normal'] || '未知'}
              </Text>
              <Text className='trend-chart__x-label'>{formatDateLabel(point.date)}</Text>
            </View>
          ))}
        </View>
        <View className='trend-chart__legend'>
          {Object.entries(APPETITE_LABELS).map(([key, label]) => (
            <View key={key} className='trend-chart__legend-item'>
              <View
                className='trend-chart__legend-dot'
                style={{ backgroundColor: APPETITE_COLORS[key] }}
              />
              <Text className='trend-chart__legend-text'>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderStoolChart = () => {
    if (!stoolChartData || stoolChartData.length === 0) {
      return (
        <View className='trend-chart__empty'>
          <Text className='trend-chart__empty-text'>暂无便便数据</Text>
          <Text className='trend-chart__empty-hint'>打卡时记录便便状态即可生成趋势图</Text>
        </View>
      )
    }

    return (
      <View className='trend-chart__container'>
        <View className='trend-chart__bar-chart'>
          {stoolChartData.map((point) => (
            <View key={point.date} className={`trend-chart__bar-item${abnormalDateSet.has(point.date) ? ' trend-chart__bar-item--abnormal' : ''}`}>
              <View className='trend-chart__bar-wrap'>
                <View
                  className='trend-chart__bar'
                  style={{
                    height: '100%',
                    backgroundColor: STOOL_COLORS[point.stool || 'normal'] || '#52C41A'
                  }}
                />
                {abnormalDateSet.has(point.date) && <View className='trend-chart__bar-mark' />}
              </View>
              <Text className='trend-chart__bar-label'>
                {STOOL_LABELS[point.stool || 'normal'] || '未知'}
              </Text>
              <Text className='trend-chart__x-label'>{formatDateLabel(point.date)}</Text>
            </View>
          ))}
        </View>
        <View className='trend-chart__legend'>
          {Object.entries(STOOL_LABELS).map(([key, label]) => (
            <View key={key} className='trend-chart__legend-item'>
              <View
                className='trend-chart__legend-dot'
                style={{ backgroundColor: STOOL_COLORS[key] }}
              />
              <Text className='trend-chart__legend-text'>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderSummaryView = () => {
    return (
      <View className='trend-summary'>
        {summary && (
          <View className='trend-card trend-summary__ai-card'>
            <View className='trend-card__header'>
              <Text className='trend-card__title'>AI 趋势分析</Text>
              <Text className='trend-card__period'>
                {timeRange === 'week' ? '近7天' : timeRange === 'month' ? '近30天' : '近90天'}
              </Text>
            </View>
            <View className='trend-summary__stats'>
              <View className='trend-summary__stat-item'>
                <Text className='trend-summary__stat-value'>{summary.totalDays}</Text>
                <Text className='trend-summary__stat-label'>打卡天数</Text>
              </View>
              <View className='trend-summary__stat-item'>
                <Text className='trend-summary__stat-value' style={{ color: summary.abnormalDays > 0 ? '#FF4D4F' : '#52C41A' }}>
                  {summary.abnormalDays}
                </Text>
                <Text className='trend-summary__stat-label'>异常天数</Text>
              </View>
              <View className='trend-summary__stat-item'>
                <Text className='trend-summary__stat-value'>
                  {summary.weightChangePercent > 0 ? '+' : ''}{summary.weightChangePercent.toFixed(1)}%
                </Text>
                <Text className='trend-summary__stat-label'>体重变化</Text>
              </View>
            </View>
            <View className='trend-summary__ai-text'>
              <Text className='trend-summary__ai-label'>AI 分析</Text>
              <Text className='trend-summary__ai-content'>{summary.aiAnalysis || '暂无分析数据'}</Text>
            </View>
          </View>
        )}

        {abnormalDays.length > 0 && (
          <View className='trend-card trend-summary__abnormal-card'>
            <View className='trend-card__header'>
              <Text className='trend-card__title'>异常标记</Text>
              <Text className='trend-card__badge'>{abnormalDays.length}天</Text>
            </View>
            <View className='trend-summary__abnormal-list'>
              {abnormalDays.map((day) => (
                <View key={day.date} className='trend-summary__abnormal-item'>
                  <View
                    className='trend-summary__abnormal-dot'
                    style={{ backgroundColor: RISK_COLORS[day.riskLevel || 'caution'] }}
                  />
                  <Text className='trend-summary__abnormal-date'>{day.date}</Text>
                  <Text className='trend-summary__abnormal-desc'>
                    {[
                      day.appetite && day.appetite !== 'normal' ? `食欲${APPETITE_LABELS[day.appetite]}` : '',
                      day.stool && day.stool !== 'normal' ? `便便${STOOL_LABELS[day.stool]}` : '',
                      day.vomiting ? '呕吐' : ''
                    ].filter(Boolean).join('、') || '异常'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {monthlyReport && (
          <View className='trend-card trend-summary__report-card'>
            <View className='trend-card__header'>
              <Text className='trend-card__title'>月度健康报告</Text>
              <Text className='trend-card__period'>{monthlyReport.month}</Text>
            </View>
            {monthlyReport.highlights.length > 0 && (
              <View className='trend-summary__section'>
                <Text className='trend-summary__section-title'>✨ 亮点</Text>
                {monthlyReport.highlights.map((item, index) => (
                  <View key={index} className='trend-summary__list-item'>
                    <Text className='trend-summary__list-dot' style={{ color: '#52C41A' }}>●</Text>
                    <Text className='trend-summary__list-text'>{item}</Text>
                  </View>
                ))}
              </View>
            )}
            {monthlyReport.concerns.length > 0 && (
              <View className='trend-summary__section'>
                <Text className='trend-summary__section-title'>⚠️ 关注</Text>
                {monthlyReport.concerns.map((item, index) => (
                  <View key={index} className='trend-summary__list-item'>
                    <Text className='trend-summary__list-dot' style={{ color: '#FAAD14' }}>●</Text>
                    <Text className='trend-summary__list-text'>{item}</Text>
                  </View>
                ))}
              </View>
            )}
            {monthlyReport.recommendations.length > 0 && (
              <View className='trend-summary__section'>
                <Text className='trend-summary__section-title'>💡 建议</Text>
                {monthlyReport.recommendations.map((item, index) => (
                  <View key={index} className='trend-summary__list-item'>
                    <Text className='trend-summary__list-dot' style={{ color: '#FF8C42' }}>●</Text>
                    <Text className='trend-summary__list-text'>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  const renderChart = () => {
    switch (activeTab) {
      case 'weight':
        return renderWeightChart()
      case 'appetite':
        return renderAppetiteChart()
      case 'stool':
        return renderStoolChart()
      case 'summary':
        return renderSummaryView()
      default:
        return null
    }
  }

  return (
    <View className='pet-trends-page'>
      <PetSwitcher
        pets={pets}
        currentPetId={currentPet?.id || null}
        onSwitch={handlePetSwitch}
      />

      {currentPet && expressionContext && (
        <View className='pet-trends__avatar'>
          <PetAvatar
            species={currentPet.species as 'dog' | 'cat'}
            petName={currentPet.name}
            expressionContext={expressionContext}
            size={80}
            showLabel
          />
        </View>
      )}

      <View className='pet-trends__time-range'>
        {TIME_RANGE_OPTIONS.map((option) => {
          const locked = !isMember && (option.key === 'month' || option.key === 'quarter')
          return (
            <View
              key={option.key}
              className={`pet-trends__time-btn ${timeRange === option.key ? 'pet-trends__time-btn--active' : ''}${locked ? ' pet-trends__time-btn--locked' : ''}`}
              onClick={() => handleTimeRangeChange(option.key)}
            >
              <Text className='pet-trends__time-btn-text'>{option.label}</Text>
              {locked && <Text className='pet-trends__time-btn-lock'>🔒</Text>}
            </View>
          )
        })}
      </View>

      <View className='pet-trends__tabs'>
        {TREND_TABS.map((tab) => (
          <View
            key={tab.key}
            className={`pet-trends__tab ${activeTab === tab.key ? 'pet-trends__tab--active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text className='pet-trends__tab-text'>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY className='pet-trends__content' enhanced showScrollbar={false}>
        {isLoading ? (
          <PageLoading text='加载健康数据中...' />
        ) : error ? (
          <PageError message={error} onRetry={loadTrendData} />
        ) : (
          <View className='pet-trends__chart-area'>
            {renderChart()}
          </View>
        )}
      </ScrollView>

      <PaywallPopup
        visible={paywallVisible}
        featureName="健康趋势"
        remainingFree={0}
        onUpgrade={() => { setPaywallVisible(false); Taro.switchTab({ url: '/pages/member/index' }) }}
        onClose={() => setPaywallVisible(false)}
      />

      <View className="export-section">
        <Button
          className="preview-btn"
          onClick={handlePreviewReport}
          disabled={generating || !currentPet}
        >
          {generating ? '生成中...' : '预览报告'}
        </Button>
        <Button
          className="export-btn"
          onClick={handleExportReport}
          disabled={generating || !currentPet}
        >
          {generating ? '生成中...' : '保存图片'}
        </Button>
        <Button
          className="csv-btn"
          onClick={handleExportCsv}
          disabled={generating || !currentPet}
        >
          {generating ? '生成中...' : '导出CSV'}
        </Button>
        <Button
          className="vet-btn"
          onClick={handleShareToVet}
          disabled={generating || !currentPet}
        >
          分享给兽医
        </Button>
        <Button
          className="share-btn"
          onClick={handleShareTrend}
          disabled={!currentPet || !summary}
        >
          分享趋势
        </Button>
      </View>

      {showReport && reportData && (
        <View className="report-modal">
          <View className="modal-overlay" onClick={() => setShowReport(false)} />
          <View className="modal-content">
            <View className="modal-header">
              <Text className="modal-title">健康报告预览</Text>
              <Text className="modal-close" onClick={() => setShowReport(false)}>✕</Text>
            </View>
            <View className="modal-body">
              <HealthReportPreview data={reportData} />
            </View>
            <View className="modal-footer">
              <Button className="download-btn" onClick={handleExportReport}>
                保存到相册
              </Button>
            </View>
          </View>
        </View>
      )}

      {showTrendShare && trendShareData && (
        <HealthTrendShareCard
          {...trendShareData}
          inviteCode={inviteCode}
          onShare={handleTrendShareConfirm}
          onClose={handleTrendShareClose}
        />
      )}

      {showNpsSurvey && user && (
        <NpsSurvey
          triggerEvent={npsTriggerEvent}
          onSubmit={(score, feedback) => {
            submitNpsResponse(user.id, score, npsTriggerEvent, feedback)
            setShowNpsSurvey(false)
          }}
          onDismiss={() => {
            dismissNpsSurvey()
            setShowNpsSurvey(false)
          }}
        />
      )}

      <View className='pet-trends__disclaimer'>
        <Text className='pet-trends__disclaimer-text'>{disclaimerText}</Text>
      </View>

    </View>
  )
}
