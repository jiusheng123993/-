import { View, Text, Image } from '@tarojs/components';
import type { PetProfile } from '../services/petService';
import './PetCard.scss';

interface PetCardProps {
  pet: PetProfile;
  isCurrent?: boolean;
  onClick?: (pet: PetProfile) => void;
  onLongPress?: (pet: PetProfile) => void;
}

const calculateAge = (birthDate: string): string => {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years > 0) return `${years}岁${months > 0 ? months + '个月' : ''}`;
  if (months > 0) return `${months}个月`;
  const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  return `${days}天`;
};

const getDefaultAvatar = (species: 'dog' | 'cat'): string => {
  return species === 'dog' ? '🐕' : '🐱';
};

const PetCard: React.FC<PetCardProps> = ({ pet, isCurrent = false, onClick, onLongPress }) => {
  const handleClick = () => {
    onClick?.(pet);
  };

  const handleLongPress = () => {
    onLongPress?.(pet);
  };

  const age = calculateAge(pet.birthDate);
  const defaultAvatar = getDefaultAvatar(pet.species);

  return (
    <View
      className={`pet-card ${isCurrent ? 'pet-card--current' : ''} ${pet.isDeceased ? 'pet-card--deceased' : ''}`}
      onClick={handleClick}
      onLongPress={handleLongPress}
    >
      <View className='pet-card__avatar'>
        {pet.avatarPhotoUrl ? (
          <Image className='pet-card__avatar-img' src={pet.avatarPhotoUrl} mode='aspectFill' />
        ) : (
          <Text className='pet-card__avatar-emoji'>{defaultAvatar}</Text>
        )}
      </View>

      <View className='pet-card__info'>
        <View className='pet-card__name-row'>
          <Text className='pet-card__name'>{pet.name}</Text>
          <Text
            className={`pet-card__gender ${pet.gender === 'male' ? 'pet-card__gender--male' : 'pet-card__gender--female'}`}
          >
            {pet.gender === 'male' ? '♂️' : '♀️'}
          </Text>
          {isCurrent && (
            <View className='pet-card__tag pet-card__tag--current'>
              <Text className='pet-card__tag-text'>当前</Text>
            </View>
          )}
          {pet.isDeceased && (
            <View className='pet-card__tag pet-card__tag--deceased'>
              <Text className='pet-card__tag-text'>已离世</Text>
            </View>
          )}
        </View>

        <Text className='pet-card__breed'>{pet.breed}</Text>

        <Text className='pet-card__detail'>
          {age} · {pet.weight}kg
        </Text>
      </View>
    </View>
  );
};

export default PetCard;