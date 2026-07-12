// 星寰海 v2.0 - 命名步骤组件
// 帮助用户识别和命名当前情绪

import { View, Text } from '@tarojs/components';
import './EmergencyStepNaming.scss';

interface NamingOption {
  id: string;
  label: string;
  description?: string;
}

interface EmergencyStepNamingProps {
  title: string;
  subtitle?: string;
  options: NamingOption[];
  flowColor: string;
  onSelect: (optionId: string) => void;
  selectedId?: string;
}

export default function EmergencyStepNaming({
  title,
  subtitle,
  options,
  flowColor,
  onSelect,
  selectedId
}: EmergencyStepNamingProps) {
  return (
    <View className="naming-step">
      <View className="naming-header">
        <Text className="naming-title">{title}</Text>
        {subtitle && <Text className="naming-subtitle">{subtitle}</Text>}
      </View>

      <View className="naming-options">
        {options.map((option) => (
          <View
            key={option.id}
            className={`naming-option ${selectedId === option.id ? 'selected' : ''}`}
            style={{ borderColor: selectedId === option.id ? flowColor : undefined }}
            onClick={() => onSelect(option.id)}
          >
            <Text className="naming-option-label">{option.label}</Text>
            {option.description && (
              <Text className="naming-option-desc">{option.description}</Text>
            )}
          </View>
        ))}
      </View>

      <View className="naming-hint">
        <Text>选择一个最贴近你感受的词</Text>
      </View>
    </View>
  );
}