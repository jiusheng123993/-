import { View, Text, Image } from '@tarojs/components';
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
  onShare: () => void;
}

const SAFETY_LEVEL_CONFIG: Record<SafetyLevel, { label: string; color: string; bgColor: string }> = {
  safe: { label: '安全', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)' },
  caution: { label: '注意', color: '#FFC107', bgColor: 'rgba(255, 193, 7, 0.1)' },
  dangerous: { label: '危险', color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  toxic: { label: '有毒', color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.1)' },
};

const MAX_VISIBLE_SYMPTOMS = 3;

export default function FoodShareCard({
  foodName,
  safetyLevel,
  petName,
  petAvatar,
  dangerousCompounds,
  symptoms,
  detail,
  onShare,
}: FoodShareCardProps) {
  const config = SAFETY_LEVEL_CONFIG[safetyLevel];
  const visibleSymptoms = symptoms?.slice(0, MAX_VISIBLE_SYMPTOMS) ?? [];
  const remainingSymptoms = (symptoms?.length ?? 0) - MAX_VISIBLE_SYMPTOMS;

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
        <View className='food-share-card__share-btn' onClick={onShare}>
          <Text className='food-share-card__share-btn-text'>分享给好友</Text>
        </View>
      </View>
    </View>
  );
}
