// 星寰海 v3.0 - 急救步骤3：采取行动（水墨风格）
import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import './EmergencyStepAction.scss';

interface ActionOption {
  id: string;
  title: string;
  description: string;
}

interface EmergencyStepActionProps {
  title: string;
  subtitle: string;
  options: ActionOption[];
  defaultOptionId?: string;
  onSelect: (optionId: string) => void;
}

export default function EmergencyStepAction({
  title,
  subtitle,
  options,
  defaultOptionId,
  onSelect,
}: EmergencyStepActionProps) {
  const [selected, setSelected] = useState<string | undefined>(defaultOptionId);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    onSelect(optionId);
  };

  const handleComplete = (optionId: string) => {
    setCompleted(prev => new Set([...prev, optionId]));
  };

  return (
    <View className='emergency-step-action'>
      <View className='step-header'>
        <Text className='step-title'>{title}</Text>
        <Text className='step-subtitle'>{subtitle}</Text>
      </View>

      <View className='actions-list'>
        {options.map((option, index) => (
          <View
            key={option.id}
            className={`action-card ${selected === option.id ? 'selected' : ''} ${completed.has(option.id) ? 'completed' : ''}`}
            onClick={() => handleSelect(option.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <View className='action-content'>
              <View className='action-header'>
                <Text className='action-title'>{option.title}</Text>
                {completed.has(option.id) && (
                  <View className='completed-badge'>
                    <Text className='completed-text'>✓</Text>
                  </View>
                )}
              </View>
              <Text className='action-description'>{option.description}</Text>
            </View>

            {/* 呼吸练习指示器 */}
            {option.id === 'breathing' && selected === option.id && (
              <View className='breathing-guide'>
                <View className='breathing-circle'>
                  <View className='breathing-inner' />
                </View>
                <Text className='breathing-text'>跟随圆圈呼吸</Text>
              </View>
            )}

            {/* 完成按钮 */}
            {selected === option.id && !completed.has(option.id) && (
              <View
                className='complete-btn'
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(option.id);
                }}
              >
                <Text className='complete-text'>完成练习</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
