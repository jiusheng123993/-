/**
 * NPS 满意度调查组件
 * 收集用户推荐度评分（0-10）和反馈意见
 */
import { useState, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import type { NpsTriggerEvent } from '../types/npsTypes';
import './NpsSurvey.scss';

interface NpsSurveyProps {
  triggerEvent: NpsTriggerEvent;
  onSubmit: (score: number, feedback: string) => void;
  onDismiss: () => void;
}

function getScoreLabel(score: number): string {
  if (score <= 6) return '不太满意';
  if (score <= 8) return '还行';
  return '非常满意';
}

export default function NpsSurvey({ triggerEvent, onSubmit, onDismiss }: NpsSurveyProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleScoreSelect = useCallback((score: number) => {
    setSelectedScore(score);
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedScore === null) return;
    onSubmit(selectedScore, feedback);
    setSubmitted(true);
  }, [selectedScore, feedback, onSubmit]);

  const scores = Array.from({ length: 11 }, (_, i) => i);

  if (submitted) {
    return (
      <View className='nps-survey'>
        <View className='nps-survey__overlay' onClick={onDismiss} />
        <View className='nps-survey__card'>
          <View className='nps-survey__thanks'>
            <Text className='nps-survey__thanks-emoji'>🎉</Text>
            <Text className='nps-survey__thanks-text'>感谢您的反馈！</Text>
            <Text className='nps-survey__thanks-desc'>我们会持续改进，为毛孩子提供更好的服务</Text>
          </View>
          <View className='nps-survey__close-btn' onClick={onDismiss}>
            <Text className='nps-survey__close-btn-text'>关闭</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className='nps-survey'>
      <View className='nps-survey__overlay' onClick={onDismiss} />
      <View className='nps-survey__card'>
        <View className='nps-survey__header'>
          <Text className='nps-survey__title'>您有多愿意推荐星河宠记？</Text>
          <Text className='nps-survey__subtitle'>0 = 完全不会 · 10 = 一定会</Text>
        </View>

        <View className='nps-survey__scores'>
          {scores.map(score => (
            <View
              key={score}
              className={`nps-survey__score ${selectedScore === score ? 'nps-survey__score--selected' : ''} ${score <= 6 ? 'nps-survey__score--low' : score <= 8 ? 'nps-survey__score--mid' : 'nps-survey__score--high'}`}
              onClick={() => handleScoreSelect(score)}
            >
              <Text className='nps-survey__score-number'>{score}</Text>
            </View>
          ))}
        </View>

        {selectedScore !== null && (
          <View className='nps-survey__score-label'>
            <Text className='nps-survey__score-label-text'>{getScoreLabel(selectedScore)}</Text>
          </View>
        )}

        {selectedScore !== null && (
          <View className='nps-survey__feedback'>
            <Input
              className='nps-survey__feedback-input'
              placeholder='请告诉我们如何改进（选填）'
              value={feedback}
              onInput={(e) => setFeedback(e.detail.value || '')}
              maxlength={200}
            />
          </View>
        )}

        <View className='nps-survey__actions'>
          <View className='nps-survey__skip' onClick={onDismiss}>
            <Text className='nps-survey__skip-text'>稍后再说</Text>
          </View>
          {selectedScore !== null && (
            <View className='nps-survey__submit' onClick={handleSubmit}>
              <Text className='nps-survey__submit-text'>提交</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
