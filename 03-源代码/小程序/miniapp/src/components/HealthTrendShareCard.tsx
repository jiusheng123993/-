import { View, Text, Image } from '@tarojs/components';
import type { HealthTrendShareData } from '../types/shareTypes';
import './HealthTrendShareCard.scss';

interface HealthTrendShareCardProps extends HealthTrendShareData {
  onShare: () => void;
  onClose: () => void;
}

export default function HealthTrendShareCard({
  petName,
  petAvatar,
  dateRange,
  trendSummary,
  aiInsight,
  onShare,
  onClose,
}: HealthTrendShareCardProps) {
  return (
    <View className='health-trend-share'>
      <View className='health-trend-share__overlay' onClick={onClose} />
      <View className='health-trend-share__card'>
        <View className='health-trend-share__header'>
          <View className='health-trend-share__brand'>星寰海</View>
          <View className='health-trend-share__close' onClick={onClose}>✕</View>
        </View>

        <View className='health-trend-share__pet-info'>
          {petAvatar && (
            <Image className='health-trend-share__pet-avatar' src={petAvatar} mode='aspectFill' />
          )}
          <Text className='health-trend-share__pet-name'>{petName}的健康趋势</Text>
        </View>

        <View className='health-trend-share__date'>{dateRange}</View>

        <View className='health-trend-share__summary'>
          <Text className='health-trend-share__summary-label'>趋势概览</Text>
          <Text className='health-trend-share__summary-text'>{trendSummary}</Text>
        </View>

        {aiInsight && (
          <View className='health-trend-share__insight'>
            <Text className='health-trend-share__insight-label'>AI 分析</Text>
            <Text className='health-trend-share__insight-text'>{aiInsight}</Text>
          </View>
        )}

        <View className='health-trend-share__footer'>
          <Text className='health-trend-share__footer-text'>宠物健康管家 · 记录每一天</Text>
        </View>

        <View className='health-trend-share__actions'>
          <View className='health-trend-share__share-btn' onClick={onShare}>
            <Text className='health-trend-share__share-btn-text'>分享给朋友</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
