// 星寰海 v2.0 - 情绪选择器组件
import { View, Text } from '@tarojs/components';
import { MOOD_TAGS } from '../data/moodTags';
import type { MoodTag } from '../memory-body/types/memoryBodyTypes';
import './MoodSelector.scss';

interface MoodSelectorProps {
  selected?: MoodTag | null;
  onSelect: (mood: MoodTag) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <View className='mood-selector'>
      <Text className='mood-selector-title'>此刻的心情</Text>
      <View className='mood-tags-grid'>
        {MOOD_TAGS.map((tag) => (
          <View
            key={tag.key}
            className={`mood-tag ${selected === tag.key ? 'selected' : ''}`}
            style={{ backgroundColor: tag.color }}
            onClick={() => onSelect(tag.key)}
          >
            <Text className='mood-tag-label'>{tag.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
