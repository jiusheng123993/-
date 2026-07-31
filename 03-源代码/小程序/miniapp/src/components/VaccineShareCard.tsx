/**
 * 疫苗分享卡片组件
 * 展示宠物疫苗完成信息，支持保存图片和分享
 */
import { View, Text, Image, Canvas } from '@tarojs/components';
import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { renderShareCardToCanvas, saveShareImage } from '../utils/shareCanvasRenderer';
import type { VaccineShareData } from '../types/shareTypes';
import './VaccineShareCard.scss';

interface VaccineShareCardProps extends VaccineShareData {
  inviteCode?: string;
  onShare: () => void;
  onClose: () => void;
}

const CANVAS_ID = 'vaccine-share-canvas';

export default function VaccineShareCard({
  petName,
  petAvatar,
  vaccineName,
  completedDate,
  badgeTitle,
  inviteCode,
  onShare,
  onClose,
}: VaccineShareCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSaveImage = useCallback(async () => {
    setSaving(true);
    try {
      const result = await renderShareCardToCanvas('vaccine', {
        petName,
        vaccineName,
        completedDate,
        badgeTitle,
        inviteCode,
      }, { canvasId: CANVAS_ID });
      await saveShareImage(result.tempFilePath);
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  }, [petName, vaccineName, completedDate, badgeTitle, inviteCode]);

  const handleShareMessage = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true });
    onShare();
  }, [onShare]);

  return (
    <View className='vaccine-share'>
      <View className='vaccine-share__overlay' onClick={onClose} />
      <View className='vaccine-share__card'>
        <View className='vaccine-share__header'>
          <View className='vaccine-share__brand'>星寰海</View>
          <View className='vaccine-share__close' onClick={onClose}>✕</View>
        </View>

        <View className='vaccine-share__badge'>
          <Text className='vaccine-share__badge-emoji'>🏆</Text>
          <Text className='vaccine-share__badge-title'>{badgeTitle}</Text>
        </View>

        <View className='vaccine-share__pet-info'>
          {petAvatar && (
            <Image className='vaccine-share__pet-avatar' src={petAvatar} mode='aspectFill' lazyLoad />
          )}
          <View className='vaccine-share__pet-detail'>
            <Text className='vaccine-share__pet-name'>{petName}</Text>
            <Text className='vaccine-share__vaccine-name'>{vaccineName}</Text>
          </View>
        </View>

        <View className='vaccine-share__date'>
          <Text className='vaccine-share__date-label'>完成日期</Text>
          <Text className='vaccine-share__date-value'>{completedDate}</Text>
        </View>

        <View className='vaccine-share__footer'>
          <Text className='vaccine-share__footer-text'>负责任的毛孩子家长 · 星寰海</Text>
        </View>

        {inviteCode && (
          <View className='vaccine-share__invite'>
            <Text className='vaccine-share__invite-text'>邀请码: {inviteCode} | 扫码一起养宠</Text>
          </View>
        )}

        <View className='vaccine-share__actions'>
          <Canvas type='2d' id={CANVAS_ID} className='vaccine-share__canvas' style={{ width: '750px', height: '1334px', position: 'absolute', left: '-9999px' }} />
          <View className='vaccine-share__save-btn' onClick={handleSaveImage}>
            <Text className='vaccine-share__save-btn-text'>{saving ? '生成中...' : '保存图片'}</Text>
          </View>
          <View className='vaccine-share__share-btn' onClick={handleShareMessage}>
            <Text className='vaccine-share__share-btn-text'>炫耀一下</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
