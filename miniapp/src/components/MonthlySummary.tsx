// 星寰海 v2.0 - 月度摘要组件
import { View, Text } from '@tarojs/components';
import { useMemo } from 'react';
import { useScheduleStore } from '../stores/scheduleStore';
import './MonthlySummary.scss';

interface MonthlySummaryProps {
  year: number;
  month: number;
}

/** 情绪标签映射 */
const MOOD_LABELS: Record<string, string> = {
  sad: '难过',
  anxious: '焦虑',
  tired: '疲惫',
  lonely: '孤独',
  unclear: '说不清',
  happy: '开心',
  calm: '平静',
  angry: '愤怒',
  fearful: '恐惧',
  joyful: '喜悦',
  stressed: '压力大',
  relaxed: '放松',
  frustrated: '挫败',
  hopeful: '有希望',
  guilty: '内疚',
  ashamed: '羞愧',
  grateful: '感恩',
  disappointed: '失望',
  nervous: '紧张',
  confident: '自信',
  lonely_deep: '深度孤独',
  empty: '空虚',
  overwhelmed: '崩溃',
};

/** 趋势图标和颜色 */
function getTrendInfo(trend: 'improving' | 'declining' | 'stable') {
  switch (trend) {
    case 'improving':
      return { icon: '↑', color: '#22c55e', label: '改善中' };
    case 'declining':
      return { icon: '↓', color: '#ef4444', label: '需关注' };
    default:
      return { icon: '→', color: '#6b7280', label: '稳定' };
  }
}

export default function MonthlySummary({ year, month }: MonthlySummaryProps) {
  const { getMonthlyStats } = useScheduleStore();

  // 获取月度统计
  const stats = useMemo(() => {
    return getMonthlyStats(year, month);
  }, [year, month, getMonthlyStats]);

  // 风险等级分布
  const riskDistribution = useMemo(() => {
    const events = useScheduleStore.getState().events;
    const monthEvents = events.filter(e => {
      const [y, m] = e.date.split('-').map(Number);
      return y === year && m === month + 1;
    });

    const distribution = {
      critical: monthEvents.filter(e => e.riskLevel === 'critical').length,
      high: monthEvents.filter(e => e.riskLevel === 'high').length,
      medium: monthEvents.filter(e => e.riskLevel === 'medium').length,
      low: monthEvents.filter(e => e.riskLevel === 'low').length,
    };

    return distribution;
  }, [year, month]);

  const trendInfo = getTrendInfo(stats.trend);

  return (
    <View className='monthly-summary'>
      {/* 标题 */}
      <View className='summary-header'>
        <Text className='summary-title'>月度概览</Text>
        <Text className='summary-period'>{year}年{month + 1}月</Text>
      </View>

      {/* 核心指标 */}
      <View className='metrics-grid'>
        <View className='metric-card primary'>
          <Text className='metric-value'>{stats.totalEntries}</Text>
          <Text className='metric-label'>总记录数</Text>
        </View>
        <View className='metric-card'>
          <Text className='metric-value' style={{ color: '#f97316' }}>{stats.avgIntensity}</Text>
          <Text className='metric-label'>平均强度</Text>
        </View>
        <View className='metric-card'>
          <Text className='metric-value' style={{ color: stats.dailyAverage > 1 ? '#ef4444' : '#22c55e' }}>
            {stats.dailyAverage}
          </Text>
          <Text className='metric-label'>日均记录</Text>
        </View>
      </View>

      {/* 趋势指示器 */}
      <View className='trend-indicator' style={{ backgroundColor: trendInfo.color + '15' }}>
        <Text className='trend-icon' style={{ color: trendInfo.color }}>{trendInfo.icon}</Text>
        <Text className='trend-text' style={{ color: trendInfo.color }}>
          {trendInfo.label}
        </Text>
      </View>

      {/* 最常见情绪 */}
      {stats.mostCommonMood && (
        <View className='common-mood'>
          <Text className='section-label'>最常见情绪</Text>
          <View className='mood-tag'>
            <Text className='mood-text'>{MOOD_LABELS[stats.mostCommonMood] || stats.mostCommonMood}</Text>
          </View>
        </View>
      )}

      {/* 高风险天数 */}
      <View className='high-risk-section'>
        <Text className='section-label'>高风险天数</Text>
        <View className='risk-badge' style={{
          backgroundColor: stats.highRiskDays > 0 ? '#fef2f2' : '#f0fdf4',
          color: stats.highRiskDays > 0 ? '#dc2626' : '#16a34a',
        }}>
          <Text className='risk-count'>{stats.highRiskDays}</Text>
          <Text className='risk-unit'>天</Text>
        </View>
      </View>

      {/* 风险分布 */}
      <View className='risk-distribution'>
        <Text className='section-label'>风险分布</Text>
        <View className='distribution-bar'>
          <View
            className='bar-segment critical'
            style={{ width: `${riskDistribution.critical / (stats.totalEntries || 1) * 100}%` }}
          />
          <View
            className='bar-segment high'
            style={{ width: `${riskDistribution.high / (stats.totalEntries || 1) * 100}%` }}
          />
          <View
            className='bar-segment medium'
            style={{ width: `${riskDistribution.medium / (stats.totalEntries || 1) * 100}%` }}
          />
          <View
            className='bar-segment low'
            style={{ width: `${riskDistribution.low / (stats.totalEntries || 1) * 100}%` }}
          />
        </View>
        <View className='distribution-legend'>
          <View className='legend-item'>
            <View className='legend-dot critical' />
            <Text className='legend-text'>极高 {riskDistribution.critical}</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot high' />
            <Text className='legend-text'>高 {riskDistribution.high}</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot medium' />
            <Text className='legend-text'>中 {riskDistribution.medium}</Text>
          </View>
          <View className='legend-item'>
            <View className='legend-dot low' />
            <Text className='legend-text'>低 {riskDistribution.low}</Text>
          </View>
        </View>
      </View>

      {/* 建议提示 */}
      {stats.highRiskDays > 3 && (
        <View className='warning-tip'>
          <Text className='tip-icon'>⚠️</Text>
          <Text className='tip-text'>本月有较多高风险记录，建议关注自己的情绪状态，必要时寻求专业帮助。</Text>
        </View>
      )}
    </View>
  );
}