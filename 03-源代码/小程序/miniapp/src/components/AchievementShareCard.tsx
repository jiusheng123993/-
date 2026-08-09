/**
 * 成就分享卡片组件
 * 支持将成就卡片渲染为图片并保存或分享给好友
 */
import { View, Text, Canvas } from '@tarojs/components';
import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { renderShareCardToCanvas, saveShareImage } from '../utils/shareCanvasRenderer';
import type { AchievementShareData } from '../types/shareTypes';
import './AchievementShareCard.scss';

interface AchievementShareCardProps extends AchievementShareData {
  achievementColor: string;
  inviteCode?: string;
  onClose: () => void;
}

const CANVAS_ID = 'achievement-share-canvas';

export default function AchievementShareCard({
  petName,
  achievementTitle,
  achievementSubtitle,
  achievementIcon,
  achievementColor,
  inviteCode,
  onClose,
}: AchievementShareCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSaveImage = useCallback(async () => {
    setSaving(true);
    try {
      const result = await renderShareCardToCanvas('achievement', {
        petName,
        achievementTitle,
        achievementSubtitle,
        achievementIcon,
        achievementColor,
        inviteCode,
      }, { canvasId: CANVAS_ID });
      await saveShareImage(result.tempFilePath);
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  }, [petName, achievementTitle, achievementSubtitle, achievementIcon, achievementColor, inviteCode]);

  const handleShareMessage = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true });
    onClose();
  }, [onClose]);

  return (
    <View className='achievement-share'>
      <View className='achievement-share__overlay' onClick={onClose} />
      <View className='achievement-share__card' style={{ borderColor: achievementColor }}>
        <View className='achievement-share__close' onClick={onClose}>✕</View>
        <View className='achievement-share__icon'>
          <Text className='achievement-share__icon-text'>{achievementIcon}</Text>
        </View>
        <View className='achievement-share__info'>
          <Text className='achievement-share__title' style={{ color: achievementColor }}>{achievementTitle}</Text>
          <Text className='achievement-share__subtitle'>{achievementSubtitle}</Text>
          <Text className='achievement-share__pet-name'>{petName}</Text>
        </View>
        <View className='achievement-share__footer' style={{ backgroundColor: achievementColor }}>
          <Text className='achievement-share__footer-text'>成就纪念卡 · 星河宠记</Text>
        </View>
        {inviteCode && (
          <View className='achievement-share__invite'>
            <Text className='achievement-share__invite-text'>邀请码: {inviteCode} | 扫码一起养宠</Text>
          </View>
        )}
        <View className='achievement-share__actions'>
          <Canvas type='2d' id={CANVAS_ID} className='achievement-share__canvas' style={{ width: '750px', height: '1334px', position: 'absolute', left: '-9999px' }} />
          <View className='achievement-share__save-btn' onClick={handleSaveImage}>
            <Text className='achievement-share__save-btn-text'>{saving ? '生成中...' : '保存图片'}</Text>
          </View>
          <View className='achievement-share__share-btn' onClick={handleShareMessage}>
            <Text className='achievement-share__share-btn-text'>炫耀一下</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
