// 星寰海 v2.0 - 情绪强度滑块组件（水墨风格）
import { View, Text } from '@tarojs/components';
import type { EmotionIntensity } from '../memory-body/types/memoryBodyTypes';
import './IntensitySlider.scss';

interface IntensitySliderProps {
  value: EmotionIntensity;
  onChange: (value: EmotionIntensity) => void;
}

export default function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  const getLabel = (val: number): string => {
    if (val <= 3) return '轻微';
    if (val <= 6) return '中等';
    if (val <= 8) return '较强';
    return '强烈';
  };

  // 处理点击选择强度
  const handleSelect = (val: number) => {
    if (val >= 1 && val <= 10) {
      onChange(val as EmotionIntensity);
    }
  };

  return (
    <View className='intensity-slider'>
      <Text className='intensity-title'>情绪强度</Text>
      <View className='intensity-display'>
        <Text className='intensity-value'>{value}</Text>
        <Text className='intensity-label'>{getLabel(value)}</Text>
      </View>
      <View className='intensity-track'>
        <View
          className='intensity-fill'
          style={{
            width: `${((value - 1) / 9) * 100}%`
          }}
        />
        <View
          className='intensity-thumb'
          style={{
            left: `${((value - 1) / 9) * 100}%`
          }}
        />
      </View>
      <View className='intensity-labels'>
        <Text className='intensity-min'>1</Text>
        <Text className='intensity-max'>10</Text>
      </View>
      {/* 快速选择按钮 */}
      <View className='quick-select'>
        {[1, 3, 5, 7, 10].map((val) => (
          <View
            key={val}
            className={`quick-btn ${value === val ? 'active' : ''}`}
            onClick={() => handleSelect(val)}
          >
            <Text>{val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
