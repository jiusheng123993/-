import { View, Text, Image } from '@tarojs/components';
import type { VaccineShareData } from '../types/shareTypes';
import './VaccineShareCard.scss';

interface VaccineShareCardProps extends VaccineShareData {
  onShare: () => void;
  onClose: () => void;
}

export default function VaccineShareCard({
  petName,
  petAvatar,
  vaccineName,
  completedDate,
  badgeTitle,
  onShare,
  onClose,
}: VaccineShareCardProps) {
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
            <Image className='vaccine-share__pet-avatar' src={petAvatar} mode='aspectFill' />
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

        <View className='vaccine-share__actions'>
          <View className='vaccine-share__share-btn' onClick={onShare}>
            <Text className='vaccine-share__share-btn-text'>炫耀一下</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
