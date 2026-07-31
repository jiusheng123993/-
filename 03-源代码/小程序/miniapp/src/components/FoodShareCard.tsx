/**
 * 食物安全分享卡片组件
 * 展示食物安全等级、危险成分和症状，支持保存图片和分享
 */
import { View, Text, Image, Canvas } from '@tarojs/components';
import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { renderShareCardToCanvas, saveShareImage } from '../utils/shareCanvasRenderer';
import './FoodShareCard.scss';

type SafetyLevel = 'safe' | 'caution' | 'dangerous' | 'toxic';

interface FoodShareCardProps {
  foodName: string;
  safetyLevel: SafetyLevel;
  petName: string;
  petAvatar?: string;
  dangerousCompounds?: string[];
  symptoms?: string[];
  detail?: string;
  inviteCode?: string;
  onShare: () => void;
  onClose?: () => void;
}

const SAFETY_LEVEL_CONFIG: Record<SafetyLevel, { label: string; color: string; bgColor: string }> = {
  safe: { label: '安全', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)' },
  caution: { label: '注意', color: '#FFC107', bgColor: 'rgba(255, 193, 7, 0.1)' },
  dangerous: { label: '危险', color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  toxic: { label: '有毒', color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.1)' },
};

const MAX_VISIBLE_SYMPTOMS = 3;
const CANVAS_ID = 'food-share-canvas';

export default function FoodShareCard({
  foodName,
  safetyLevel,
  petName,
  petAvatar,
  dangerousCompounds,
  symptoms,
  detail,
  inviteCode,
  onShare,
  onClose,
}: FoodShareCardProps) {
  const [saving, setSaving] = useState(false);
  const config = SAFETY_LEVEL_CONFIG[safetyLevel];
  const visibleSymptoms = symptoms?.slice(0, MAX_VISIBLE_SYMPTOMS) ?? [];
  const remainingSymptoms = (symptoms?.length ?? 0) - MAX_VISIBLE_SYMPTOMS;

  const handleSaveImage = useCallback(async () => {
    setSaving(true);
    try {
      const result = await renderShareCardToCanvas('food', {
        foodName,
        safetyLevel,
        petName,
        dangerousCompounds,
        symptoms,
        inviteCode,
      }, { canvasId: CANVAS_ID });
      await saveShareImage(result.tempFilePath);
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      setSaving(false);
    }
  }, [foodName, safetyLevel, petName, dangerousCompounds, symptoms, inviteCode]);

  const handleShareMessage = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true });
    onShare();
  }, [onShare]);

  return (
    <View className='food-share-card'>
      <View className='food-share-card__header'>
        <View className='food-share-card__pet'>
          <View className='food-share-card__pet-avatar'>
            {petAvatar ? (
              <Image className='food-share-card__pet-avatar-img' src={petAvatar} mode='aspectFill' lazyLoad />
            ) : (
              <Text className='food-share-card__pet-avatar-emoji'>🐾</Text>
            )}
          </View>
          <Text className='food-share-card__pet-name'>{petName}</Text>
        </View>
        <View
          className={`food-share-card__badge food-share-card__badge--${safetyLevel}`}
          style={{ backgroundColor: config.bgColor }}
        >
          <View className='food-share-card__badge-dot' style={{ backgroundColor: config.color }} />
          <Text className='food-share-card__badge-text' style={{ color: config.color }}>
            {config.label}
          </Text>
        </View>
      </View>

      <View className='food-share-card__body'>
        <Text className='food-share-card__food-name'>{foodName}</Text>

        {dangerousCompounds && dangerousCompounds.length > 0 && (
          <View className='food-share-card__compounds'>
            {dangerousCompounds.map((compound) => (
              <View className='food-share-card__compound-tag' key={compound}>
                <Text className='food-share-card__compound-tag-text'>{compound}</Text>
              </View>
            ))}
          </View>
        )}

        {symptoms && symptoms.length > 0 && (
          <View className='food-share-card__symptoms'>
            {visibleSymptoms.map((symptom) => (
              <View className='food-share-card__symptom-tag' key={symptom}>
                <Text className='food-share-card__symptom-tag-text'>{symptom}</Text>
              </View>
            ))}
            {remainingSymptoms > 0 && (
              <View className='food-share-card__symptom-tag food-share-card__symptom-tag--more'>
                <Text className='food-share-card__symptom-tag-text food-share-card__symptom-tag-text--more'>
                  +{remainingSymptoms}
                </Text>
              </View>
            )}
          </View>
        )}

        {detail && (
          <Text className='food-share-card__detail'>{detail}</Text>
        )}
      </View>

      <View className='food-share-card__footer'>
        {inviteCode && (
          <View className='food-share-card__invite'>
            <Text className='food-share-card__invite-text'>邀请码: {inviteCode} | 扫码一起养宠</Text>
          </View>
        )}
        <Canvas type='2d' id={CANVAS_ID} className='food-share-card__canvas' style={{ width: '750px', height: '1334px', position: 'absolute', left: '-9999px' }} />
        <View className='food-share-card__save-btn' onClick={handleSaveImage}>
          <Text className='food-share-card__save-btn-text'>{saving ? '生成中...' : '保存图片'}</Text>
        </View>
        <View className='food-share-card__share-btn' onClick={handleShareMessage}>
          <Text className='food-share-card__share-btn-text'>分享给好友</Text>
        </View>
      </View>
    </View>
  );
}
