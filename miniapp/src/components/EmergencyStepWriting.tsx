// 星寰海 v2.0 - 书写步骤组件
// 引导用户进行表达性写作，释放情绪

import { useState, useCallback } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import './EmergencyStepWriting.scss';
import { quickDetect } from '../utils/crisisDetector';

interface WritingPrompt {
  id: string;
  text: string;
}

interface EmergencyStepWritingProps {
  title: string;
  subtitle?: string;
  prompts: WritingPrompt[];
  flowColor: string;
  onComplete: (text: string) => void;
  onCrisisDetected?: (level: 'mild' | 'moderate' | 'severe') => void;
}

export default function EmergencyStepWriting({
  title,
  subtitle,
  prompts,
  flowColor,
  onComplete,
  onCrisisDetected
}: EmergencyStepWritingProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(prompts[0]?.id || '');
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [lastDetectedLevel, setLastDetectedLevel] = useState<'mild' | 'moderate' | 'severe' | null>(null);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    setWordCount(value.length);

    // 使用危机检测器进行实时检测
    if (onCrisisDetected && value.trim().length > 0) {
      const result = quickDetect(value);
      if (result.detected && result.level !== 'mild') {
        // 避免重复触发
        if (lastDetectedLevel !== result.level) {
          setLastDetectedLevel(result.level);
          onCrisisDetected(result.level);
        }
      } else {
        setLastDetectedLevel(null);
      }
    }
  }, [onCrisisDetected, lastDetectedLevel]);

  const handleSubmit = () => {
    if (text.trim()) {
      onComplete(text);
    }
  };

  return (
    <View className="writing-step">
      <View className="writing-header">
        <Text className="writing-title">{title}</Text>
        {subtitle && <Text className="writing-subtitle">{subtitle}</Text>}
      </View>

      {/* 写作提示选择 */}
      {prompts.length > 0 && (
        <View className="writing-prompts">
          <Text className="prompts-label">从下面开始写：</Text>
          <View className="prompts-list">
            {prompts.map((prompt) => (
              <View
                key={prompt.id}
                className={`prompt-item ${selectedPromptId === prompt.id ? 'active' : ''}`}
                onClick={() => setSelectedPromptId(prompt.id)}
              >
                <Text>{prompt.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 文本输入区 */}
      <View className="writing-area">
        <Textarea
          className="writing-textarea"
          placeholder={selectedPromptId ? undefined : '在这里写下你的感受...'}
          value={text}
          onInput={(e) => handleTextChange(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <View className="writing-footer">
          <Text className="word-count">{wordCount} 字</Text>
          <Text className="hint">不用组织语言，想到什么写什么</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View
        className="submit-btn"
        style={{ backgroundColor: flowColor }}
        onClick={handleSubmit}
      >
        <Text>完成书写</Text>
      </View>
    </View>
  );
}
