// 星寰海 v2.0 - 情绪选择器组件（水墨风格）
import { View, Text } from '@tarojs/components';
import { MOOD_TAGS } from '../data/moodTags';
import type { MoodTag } from '../memory-body/types/memoryBodyTypes';
import './MoodSelector.scss';

interface MoodSelectorProps {
  selected?: MoodTag | null;
  onSelect: (mood: MoodTag) => void;
}

// SVG 图标组件
const Icon = ({ name, size = 20, color = '#2d2d2d' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    rain: 'M12 3c-4.5 0-8 3.5-8 8 0 4.5 3.5 8 8 8s8-3.5 8-8c0-4.5-3.5-8-8-8zm-1 12l-2-2m2 2l2-2m-2 2v-6',
    lightning: 'M13 2L4 14h7l-2 8 9-10h-7l2-8z',
    moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    cloud: 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z',
    sun: 'M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z',
    wave: 'M3 12c0-4 3-6 6-6s6 2 6 6-3 6-6 6-6-2-6-6z',
    fire: 'M8.5 14.5c0-2 1.5-4 3.5-6s3.5-2 3.5-2 1.5 0 3.5 2 3.5 4 3.5 6c0 4-3 7-7 7s-7-3-7-7z',
    ghost: 'M9 22v-3a3 3 0 013-3h0a3 3 0 013 3v3M7 10V7a5 5 0 0110 0v3',
    sparkle: 'M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z',
    'cloud-rain': 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zM8 14v4M12 14v4M16 14v4',
    leaf: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
    sunrise: 'M12 2v8m0 0l-3-3m3 3l3-3M5 12H2m20 0h-3M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42',
    heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    'eye-off': 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8s4-8 11-8c7 0 11 8 11 8s-4 8-11 8zM9.88 9.88A3 3 0 0112 9a3 3 0 012.12 2.12',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    crown: 'M2 4l2 12h16l2-12-6 4-4-6-4 6-6-4z',
    circle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
    'cloud-lightning': 'M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zM13 16l-2 4m2-4l2 4'
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.star} />
    </svg>
  );
};

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View className='mood-selector'>
      <Text className='mood-selector-title'>此刻的心情</Text>
      <View className='mood-tags-grid'>
        {MOOD_TAGS.map((tag) => (
          <View
            key={tag.key}
            className={`mood-tag ${selected === tag.key ? 'selected' : ''}`}
            onClick={() => onSelect(tag.key)}
          >
            <View className='mood-tag-icon-wrap'>
              <Icon name={tag.icon} size={18} color="#2d2d2d" />
            </View>
            <Text className='mood-tag-label'>{tag.label}</Text>
            {selected === tag.key && (
              <View className='mood-tag-check'>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7f4ed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
