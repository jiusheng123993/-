// 星寰海 v3.0 - 急救步骤2：书写情绪（水墨风格）
import { View, Text, Textarea } from '@tarojs/components';
import { useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import './EmergencyStepWriting.scss';

interface WritingPrompt {
  id: string;
  text: string;
}

interface EmergencyStepWritingProps {
  title: string;
  subtitle: string;
  prompts: WritingPrompt[];
  crisisKeywords: string[];
  onSubmit: (content: string) => void;
  value?: string;
}

export default function EmergencyStepWriting({
  title,
  subtitle,
  prompts,
  onSubmit,
  value = '',
}: EmergencyStepWritingProps) {
  const [content, setContent] = useState(value);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleContentChange = (e: { detail: { value: string } }) => {
    const newContent = e.detail.value;
    setContent(newContent);
    setCharCount(newContent.length);
  };

  const handlePromptSelect = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      setSelectedPrompt(promptId);
      setContent(prev => prev + (prev ? '\n' : '') + prompt.text + '\n');
      setCharCount(prev => prev + prompt.text.length + 2);
    }
  };

  const handleSubmit = () => {
    if (content.trim().length < 10) {
      Taro.showToast({ title: '请多写一点', icon: 'none' });
      return;
    }
    onSubmit(content);
  };

  return (
    <View className='emergency-step-writing'>
      <View className='step-header'>
        <Text className='step-title'>{title}</Text>
        <Text className='step-subtitle'>{subtitle}</Text>
      </View>

      {/* 提示词 */}
      <View className='prompts-section'>
        <Text className='prompts-label'>选择提示开始写作：</Text>
        <View className='prompts-list'>
          {prompts.map((prompt, index) => (
            <View
              key={prompt.id}
              className={`prompt-chip ${selectedPrompt === prompt.id ? 'selected' : ''}`}
              onClick={() => handlePromptSelect(prompt.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Text className='prompt-text'>{prompt.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 写作区域 */}
      <View className='writing-area'>
        <Textarea
          className='writing-textarea'
          value={content}
          onInput={handleContentChange}
          placeholder='在这里写下你的想法...'
          maxlength={2000}
          autoHeight
        />
        <View className='char-count'>
          <Text className='count-text'>{charCount} / 2000</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className='submit-section'>
        <View
          className={`submit-btn ${content.trim().length >= 10 ? 'active' : ''}`}
          onClick={handleSubmit}
        >
          <Text className='submit-text'>完成书写</Text>
        </View>
      </View>
    </View>
  );
}
