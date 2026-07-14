// 星寰海 v3.0 - 急救步骤1：命名情绪（水墨风格）
import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import './EmergencyStepNaming.scss';

interface NamingOption {
  id: string;
  label: string;
  description: string;
}

interface EmergencyStepNamingProps {
  title: string;
  subtitle: string;
  options: NamingOption[];
  onSelect: (optionId: string) => void;
  selectedId?: string;
}

export default function EmergencyStepNaming({
  title,
  subtitle,
  options,
  onSelect,
  selectedId,
}: EmergencyStepNamingProps) {
  const [selected, setSelected] = useState<string | undefined>(selectedId);

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    onSelect(optionId);
  };

  return (
    <View className='emergency-step-naming'>
      <View className='step-header'>
        <Text className='step-title'>{title}</Text>
        <Text className='step-subtitle'>{subtitle}</Text>
      </View>

      <View className='options-list'>
        {options.map((option, index) => (
          <View
            key={option.id}
            className={`option-card ${selected === option.id ? 'selected' : ''}`}
            onClick={() => handleSelect(option.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <View className='option-content'>
              <Text className='option-label'>{option.label}</Text>
              <Text className='option-description'>{option.description}</Text>
            </View>
            <View className={`option-indicator ${selected === option.id ? 'active' : ''}`}>
              <Text className='indicator-dot' />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
