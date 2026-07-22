import { View, Text, Image, Canvas } from '@tarojs/components';
import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { renderShareCardToCanvas, saveShareImage } from '../utils/shareCanvasRenderer';
import type { HealthTrendShareData } from '../types/shareTypes';
import './HealthTrendShareCard.scss';

interface HealthTrendShareCardProps extends HealthTrendShareData {
  inviteCode?: string;
  onShare: () => void;
  onClose: () => void;
}

const CANVAS_ID = 'health-trend-share-canvas';

export default function HealthTrendShareCard({
  petName,
  petAvatar,
  dateRange,
  trendSummary,
  aiInsight,
  inviteCode,
  onShare,
  onClose,
}: HealthTrendShareCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSaveImage = useCallback(async () => {
    setSaving(true);
    try {
      const result = await renderShareCardToCanvas('health_trend', {
        petName,
        dateRange,
        trendSummary,
        aiInsight,
        inviteCode,
      }, { canvasId: CANVAS_ID });
      await saveShareImage(result.tempFilePath);
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  }, [petName, dateRange, trendSummary, aiInsight, inviteCode]);

  const handleShareMessage = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true });
    onShare();
  }, [onShare]);

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

        {inviteCode && (
          <View className='health-trend-share__invite'>
            <Text className='health-trend-share__invite-text'>邀请码: {inviteCode} | 扫码一起养宠</Text>
          </View>
        )}

        <View className='health-trend-share__actions'>
          <Canvas type='2d' id={CANVAS_ID} className='health-trend-share__canvas' style={{ width: '750px', height: '1334px', position: 'absolute', left: '-9999px' }} />
          <View className='health-trend-share__save-btn' onClick={handleSaveImage}>
            <Text className='health-trend-share__save-btn-text'>{saving ? '生成中...' : '保存图片'}</Text>
          </View>
          <View className='health-trend-share__share-btn' onClick={handleShareMessage}>
            <Text className='health-trend-share__share-btn-text'>分享给朋友</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
