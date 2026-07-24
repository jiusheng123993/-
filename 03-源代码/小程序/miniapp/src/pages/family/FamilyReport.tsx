import { View, Text } from '@tarojs/components'
import { getMoodEmoji, getMoodLabel } from '../../services/weeklyReportService'
import type { PetProfile } from '../../services/petService'
import type { WeeklyReportWithPet } from './utils'

interface FamilyReportProps {
  weeklyReport: {
    summary: string
    overallMood: 'excellent' | 'good' | 'fair' | 'concerning'
    highlights: string[]
    concerns: string[]
    reports: WeeklyReportWithPet[]
  }
  pets: PetProfile[]
}

export default function FamilyReport({ weeklyReport, pets }: FamilyReportProps) {
  return (
    <View className='family-report'>
      <View className='family-report-card'>
        <View className='family-report-shimmer' />
        <View className='family-report-inner'>
          <View className='family-report-header'>
            <View className='family-report-badge'>
              <Text className='family-report-badge-text'>AI周报</Text>
            </View>
            <Text className='family-report-title'>家庭健康周报</Text>
            <View className={`family-report-mood family-report-mood--${weeklyReport.overallMood}`}>
              <Text className='family-report-mood-emoji'>{getMoodEmoji(weeklyReport.overallMood)}</Text>
              <Text className='family-report-mood-text'>{getMoodLabel(weeklyReport.overallMood)}</Text>
            </View>
          </View>

          <View className='family-report-summary'>
            <Text className='family-report-summary-text'>{weeklyReport.summary}</Text>
          </View>

          {weeklyReport.highlights.length > 0 && (
            <View className='family-report-block'>
              <View className='family-report-block-header'>
                <Text className='family-report-block-icon'>✨</Text>
                <Text className='family-report-block-title'>本周亮点</Text>
              </View>
              {weeklyReport.highlights.map((h, i) => (
                <View key={i} className='family-report-bullet'>
                  <Text className='family-report-bullet-dot'>·</Text>
                  <Text className='family-report-bullet-text'>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {weeklyReport.concerns.length > 0 && (
            <View className='family-report-block'>
              <View className='family-report-block-header'>
                <Text className='family-report-block-icon'>💡</Text>
                <Text className='family-report-block-title'>需要关注</Text>
              </View>
              {weeklyReport.concerns.map((c, i) => (
                <View key={i} className='family-report-bullet'>
                  <Text className='family-report-bullet-dot family-report-bullet-dot--warn'>·</Text>
                  <Text className='family-report-bullet-text'>{c}</Text>
                </View>
              ))}
            </View>
          )}

          <View className='family-report-divider' />

          <View className='family-report-items'>
            {weeklyReport.reports.map(report => {
              const pet = pets.find(p => p.name === report.petName)
              const emoji = pet?.species === 'cat' ? '🐱' : '🐕'
              return (
                <View key={report.petName} className='family-report-item'>
                  <View className={`family-report-icon family-report-icon--${report.overallMood}`}>
                    <Text>{emoji}</Text>
                  </View>
                  <View className='family-report-text'>
                    <Text className='family-report-item-title'>{report.petName}</Text>
                    <Text className='family-report-item-desc'>
                      {report.summary.length > 20 ? report.summary.slice(0, 20) + '...' : report.summary}
                    </Text>
                  </View>
                  <View className={`family-report-badge-sm family-report-badge-sm--${report.overallMood}`}>
                    <Text>{report.score}分</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </View>
    </View>
  )
}