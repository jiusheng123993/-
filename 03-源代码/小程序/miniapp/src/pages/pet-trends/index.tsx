import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { useDidShow } from '@tarojs/taro'
import PetSwitcher from '../../components/PetSwitcher'
import FloatingNav from '../../components/FloatingNav'
import PaywallPopup from '../../components/PaywallPopup'
import AnomalyMarker from '../../components/AnomalyMarker'
import { PetAvatar } from '../../components'
import { usePetStore } from '../../stores/petStore'
import { useAuthStore } from '../../stores/authStore'
import { useTrend } from '../../hooks/useTrend'
import { useMembership } from '../../hooks/useMembership'
import type { ExpressionContext } from '../../engines/petAvatar'
import type { TrendDataPoint, TrendSummary, MonthlyReport } from '../../services/trendService'
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
    path: '/pages/pet-trends/index',
  }))

  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const { isMember, checkAccess, shouldShowPaywall, markPaywallShown } = useMembership()
  const user = useAuthStore(s => s.user)
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

  useDidShow(() => {
    fetchPets()
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
      setPaywallVisible(true)
      return
    }
    setTimeRange(range)
  }, [isMember])

  const handleTabChange = useCallback((tab: TrendTab) => {
    setActiveTab(tab)
  }, [])

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

    return (
      <View className='trend-chart__container'>
        <View className='trend-chart__y-axis'>
          <Text className='trend-chart__y-label'>{maxWeight.toFixed(1)}kg</Text>
          <Text className='trend-chart__y-label'>{((maxWeight + minWeight) / 2).toFixed(1)}kg</Text>
          <Text className='trend-chart__y-label'>{minWeight.toFixed(1)}kg</Text>
        </View>
        <View className='trend-chart__plot-area'>
          <View className='trend-chart__grid'>
            <View className='trend-chart__grid-line' />
            <View className='trend-chart__grid-line' />
            <View className='trend-chart__grid-line' />
          </View>
          <View className='trend-chart__line-chart' style={{ height: `${chartHeight}rpx` }}>
            {points.map((point, index) => {
              const x = (index / (points.length - 1 || 1)) * chartWidth
              const y = paddingTop + ((maxWeight - point.weight!) / range) * drawHeight
              const isAbnormal = abnormalDateSet.has(point.date)
              return (
                <View
                  key={point.date}
                  className='trend-chart__data-point'
                  style={{
                    left: `${x}%`,
                    bottom: `${chartHeight - y}rpx`
                  }}
                >
                  <View className='trend-chart__dot' />
                  <Text className='trend-chart__point-value'>{point.weight}kg</Text>
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
                      const y = paddingTop + ((maxWeight - point.weight!) / range) * drawHeight
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
          <View className='pet-trends__loading'>
            <Text className='pet-trends__loading-text'>加载中...</Text>
          </View>
        ) : error ? (
          <View className='pet-trends__error'>
            <Text className='pet-trends__error-text'>{error}</Text>
            <View className='pet-trends__retry-btn' onClick={loadTrendData}>
              <Text className='pet-trends__retry-text'>重试</Text>
            </View>
          </View>
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
        onUpgrade={() => { setPaywallVisible(false); Taro.navigateTo({ url: '/pages/member/index' }) }}
        onClose={() => setPaywallVisible(false)}
      />

      <FloatingNav />
    </View>
  )
}
