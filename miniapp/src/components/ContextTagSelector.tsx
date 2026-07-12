// 星寰海 v2.0 - 情境标签选择器组件
import { View, Text } from '@tarojs/components';
import { CONTEXT_TAGS } from '../data/moodTags';
import type { ContextTag } from '../memory-body/types/memoryBodyTypes';
import './ContextTagSelector.scss';

interface ContextTagSelectorProps {
  selected?: ContextTag[];
  onSelect: (context: ContextTag) => void;
}

export default function ContextTagSelector({ selected = [], onSelect }: ContextTagSelectorProps) {
  return (
    <View className='context-tag-selector'>
      <Text className='context-tag-title'>发生情境（可选）</Text>
      <View className='context-tags-list'>
        {CONTEXT_TAGS.map((tag) => (
          <View
            key={tag.key}
            className={`context-tag ${selected.includes(tag.key) ? 'selected' : ''}`}
            onClick={() => onSelect(tag.key)}
          >
            <Text>{tag.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
