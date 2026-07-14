// 星寰海 v3.0 - 急救步骤5：结束仪式（水墨风格）
import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './EmergencyStepClosing.scss';

interface ClosingOption {
  id: string;
  label: string;
  description: string;
}

interface EmergencyStepClosingProps {
  title: string;
  subtitle: string;
  options: ClosingOption[];
  onComplete: (selectedOptionId: string) => void;
}

export default function EmergencyStepClosing({
  title,
  subtitle,
  options,
  onComplete,
}: EmergencyStepClosingProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
  };

  const handleComplete = () => {
    if (!selected) {
      Taro.showToast({ title: '请选择一项', icon: 'none' });
      return;
    }
    onComplete(selected);
  };

  return (
    <View className='emergency-step-closing'>
      <View className='step-header'>
        <Text className='step-title'>{title}</Text>
        <Text className='step-subtitle'>{subtitle}</Text>
      </View>

      {/* 完成选项 */}
      <View className='options-list'>
        {options.map((option, index) => (
          <View
            key={option.id}
            className={`closing-card ${selected === option.id ? 'selected' : ''}`}
            onClick={() => handleSelect(option.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <View className='closing-content'>
              <Text className='closing-label'>{option.label}</Text>
              <Text className='closing-description'>{option.description}</Text>
            </View>
            <View className={`closing-indicator ${selected === option.id ? 'active' : ''}`}>
              <Text className='indicator-check'>✓</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 完成按钮 */}
      <View className='complete-section'>
        <View
          className={`complete-btn ${selected ? 'active' : ''}`}
          onClick={handleComplete}
        >
          <Text className='complete-text'>完成急救</Text>
        </View>
      </View>

      {/* 鼓励文字 */}
      <View className='encouragement'>
        <Text className='encouragement-text'>你已经很勇敢地面对了自己的情绪，这本身就是一种力量。</Text>
      </View>
    </View>
  );
}
