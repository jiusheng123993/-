// 星寰海 v2.0 - 行动步骤组件
// 提供互动式练习，帮助用户缓解情绪

import { useState, useEffect, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import './EmergencyStepAction.scss';

interface ActionOption {
  id: string;
  title: string;
  description: string;
  icon?: string;
  duration?: number;
}

interface BreathingPhase {
  phase: 'inhale' | 'hold' | 'exhale';
  text: string;
  duration: number;
}

interface EmergencyStepActionProps {
  title: string;
  subtitle?: string;
  options: ActionOption[];
  flowColor: string;
  onSelect: (optionId: string) => void;
  selectedId?: string;
  defaultOptionId?: string;
}

export default function EmergencyStepAction({
  title,
  subtitle,
  options,
  flowColor,
  onSelect,
  selectedId,
  defaultOptionId
}: EmergencyStepActionProps) {
  const [activeOption, setActiveOption] = useState<string>(defaultOptionId || options[0]?.id || '');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 4-7-8 呼吸阶段配置
  const breathingPhases: BreathingPhase[] = [
    { phase: 'inhale', text: '吸气 4 秒...', duration: 4 },
    { phase: 'hold', text: '屏住 7 秒...', duration: 7 },
    { phase: 'exhale', text: '呼气 8 秒...', duration: 8 }
  ];

  // 5-4-3-2-1 接地技术提示
  const groundingItems = {
    5: ['看到 5 样东西', '触摸 5 样东西'],
    4: ['听到 4 种声音', '感受 4 种触感'],
    3: ['闻到 3 种气味', '看到 3 种颜色'],
    2: ['尝到 2 种味道', '感受到 2 种温度'],
    1: ['感受到 1 种身体感觉', '专注于 1 个想法']
  };

  // 渐进式肌肉放松阶段
  const muscleRelaxationSteps = [
    '握紧拳头，保持 5 秒...',
    '松开拳头，感受放松...',
    '收紧手臂肌肉，保持 5 秒...',
    '松开手臂，感受放松...',
    '耸起肩膀，保持 5 秒...',
    '放下肩膀，感受放松...',
    '收紧腹部，保持 5 秒...',
    '松开腹部，感受放松...'
  ];

  const handleOptionClick = (optionId: string) => {
    setActiveOption(optionId);
    setIsPlaying(false);
    setPhaseIndex(0);
    onSelect(optionId);
  };

  const startExercise = () => {
    setIsPlaying(true);
    setPhaseIndex(0);
  };

  const stopExercise = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 自动切换阶段
  useEffect(() => {
    if (!isPlaying || activeOption !== 'breathing') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const currentPhase = breathingPhases[phaseIndex];
    timerRef.current = window.setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % breathingPhases.length);
    }, currentPhase.duration * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, phaseIndex, activeOption]);

  const renderBreathingAnimation = () => {
    const currentPhase = breathingPhases[phaseIndex];
    const circleScale = currentPhase.phase === 'inhale' ? 1.2 : currentPhase.phase === 'hold' ? 1.1 : 1;

    return (
      <View className="breathing-animation">
        <View
          className="breathing-circle"
          style={{
            background: `radial-gradient(circle, ${flowColor}40 0%, ${flowColor}20 100%)`,
            transform: `scale(${circleScale})`
          }}
        >
          <Text className="breathing-text">{currentPhase.text}</Text>
        </View>
        <View className="breathing-controls">
          {!isPlaying ? (
            <View className="play-btn" onClick={startExercise}>
              <Text>开始练习</Text>
            </View>
          ) : (
            <View className="stop-btn" onClick={stopExercise}>
              <Text>停止</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGroundingExercise = () => {
    return (
      <View className="grounding-exercise">
        <Text className="exercise-title">5-4-3-2-1 接地技术</Text>
        <Text className="exercise-desc">
          当你感到焦虑或难过时，这个方法可以帮助你回到当下
        </Text>
        <View className="grounding-list">
          {Object.entries(groundingItems).map(([count, items]) => (
            <View key={count} className="grounding-group">
              <Text className="count-label">{count}</Text>
              <View className="items-list">
                {items.map((item, index) => (
                  <Text key={index} className="item-text">• {item}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMuscleRelaxation = () => {
    const currentStep = muscleRelaxationSteps[phaseIndex % muscleRelaxationSteps.length];

    return (
      <View className="muscle-relaxation">
        <Text className="exercise-title">渐进式肌肉放松</Text>
        <Text className="exercise-desc">
          依次收紧和放松身体各部位的肌肉
        </Text>
        <View className="relaxation-step">
          <Text className="step-text">{currentStep}</Text>
        </View>
        <View className="relaxation-progress">
          <Text>步骤 {Math.floor(phaseIndex / 2) + 1} / 4</Text>
        </View>
        <View className="relaxation-controls">
          {!isPlaying ? (
            <View className="play-btn" onClick={startExercise}>
              <Text>开始练习</Text>
            </View>
          ) : (
            <View className="next-btn" onClick={() => setPhaseIndex((prev) => prev + 1)}>
              <Text>下一步</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMicroRest = () => {
    return (
      <View className="micro-rest">
        <Text className="exercise-title">5 分钟微休息协议</Text>
        <Text className="exercise-desc">
          即使只有几分钟，也能帮助你恢复能量
        </Text>
        <View className="rest-options">
          <View className="rest-option">
            <Text className="option-icon">😴</Text>
            <Text className="option-title">闭眼休息</Text>
            <Text className="option-desc">找一个安静的地方，闭上眼睛 5 分钟</Text>
          </View>
          <View className="rest-option">
            <Text className="option-icon">🎧</Text>
            <Text className="option-title">听白噪音</Text>
            <Text className="option-desc">雨声、海浪声、森林声...</Text>
          </View>
          <View className="rest-option">
            <Text className="option-icon">🚿</Text>
            <Text className="option-title">热水澡</Text>
            <Text className="option-desc">让温暖的水流带走疲惫</Text>
          </View>
          <View className="rest-option">
            <Text className="option-icon">📱</Text>
            <Text className="option-title">关闭通知</Text>
            <Text className="option-desc">暂时断开与外界的连接</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSelfCompassion = () => {
    return (
      <View className="self-compassion">
        <Text className="exercise-title">自我关怀练习</Text>
        <Text className="exercise-desc">
          像对待好朋友一样对待自己
        </Text>
        <View className="compassion-prompts">
          <View className="prompt-card">
            <Text className="prompt-title">1. 觉察</Text>
            <Text className="prompt-text">
              注意到自己正在经历困难的时刻，对自己说：
              <Text className="highlight">"此刻我正在经历痛苦，这是每个人都会经历的。"</Text>
            </Text>
          </View>
          <View className="prompt-card">
            <Text className="prompt-title">2. 共情</Text>
            <Text className="prompt-text">
              提醒自己：<Text className="highlight">"我不是一个人在感受这些，其他人也会经历这样的时刻。"</Text>
            </Text>
          </View>
          <View className="prompt-card">
            <Text className="prompt-title">3. 善待自己</Text>
            <Text className="prompt-text">
              给自己一些温暖的话语：<Text className="highlight">"愿我能对自己温柔一些，愿我能给自己需要的关怀。"</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSensoryGrounding = () => {
    return (
      <View className="sensory-grounding">
        <Text className="exercise-title">感官着陆练习</Text>
        <Text className="exercise-desc">
          选择一个感官，专注于它，让自己回到当下
        </Text>
        <View className="sensory-options">
          <View className="sensory-option visual">
            <Text className="option-icon">👀</Text>
            <Text className="option-title">视觉</Text>
            <Text className="option-desc">环顾四周，找到 5 样蓝色的东西</Text>
          </View>
          <View className="sensory-option auditory">
            <Text className="option-icon">👂</Text>
            <Text className="option-title">听觉</Text>
            <Text className="option-desc">闭上眼睛，聆听周围的声音</Text>
          </View>
          <View className="sensory-option tactile">
            <Text className="option-icon">✋</Text>
            <Text className="option-title">触觉</Text>
            <Text className="option-desc">感受你坐着的椅子，注意它的质地</Text>
          </View>
          <View className="sensory-option olfactory">
            <Text className="option-icon">👃</Text>
            <Text className="option-title">嗅觉</Text>
            <Text className="option-desc">深呼吸，注意你能闻到什么气味</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (activeOption) {
      case 'breathing':
        return renderBreathingAnimation();
      case 'grounding':
        return renderGroundingExercise();
      case 'muscle-relaxation':
        return renderMuscleRelaxation();
      case 'micro-rest':
        return renderMicroRest();
      case 'self-compassion':
        return renderSelfCompassion();
      case 'sensory':
        return renderSensoryGrounding();
      default:
        return null;
    }
  };

  return (
    <View className="action-step">
      <View className="action-header">
        <Text className="action-title">{title}</Text>
        {subtitle && <Text className="action-subtitle">{subtitle}</Text>}
      </View>

      {/* 选项列表 */}
      <View className="action-options">
        {options.map((option) => (
          <View
            key={option.id}
            className={`action-option ${selectedId === option.id || activeOption === option.id ? 'active' : ''}`}
            onClick={() => handleOptionClick(option.id)}
          >
            <Text className="option-main">{option.title}</Text>
            <Text className="option-desc">{option.description}</Text>
          </View>
        ))}
      </View>

      {/* 互动内容区 */}
      <View className="action-content">
        {renderContent()}
      </View>
    </View>
  );
}