import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text } from '@tarojs/components';
import './followup.scss';
import { useFollowup, type FollowupResponse, type FollowupResult } from '../../hooks/useFollowup';
import type { PendingFollowup } from '../../services/notificationService';
import { getMoodDisplayName } from '../../utils/moodHelper';

export function FollowupPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [followup, setFollowup] = useState<PendingFollowup | null>(null);
  const [result, setResult] = useState<FollowupResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const followupHook = useFollowup();

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const id = params.sessionId as string;
    if (id) {
      setSessionId(id);
      const found = followupHook.getFollowupBySessionId(id);
      setFollowup(found);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleResponse = async (response: FollowupResponse) => {
    if (!sessionId) {
      Taro.showToast({
        title: '会话ID不存在',
        icon: 'none',
      });
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    const res = await followupHook.submitFollowup(sessionId, response);
    setResult(res);
    setIsLoading(false);
    setIsSubmitting(false);

    if (res.success) {
      Taro.showToast({
        title: '感谢你的反馈',
        icon: 'success',
        duration: 2000,
      });
    }
  };

  const handleGoHome = () => {
    Taro.switchTab({
      url: '/pages/index/index',
    });
  };

  const handleTryAgain = () => {
    if (followup?.flowId) {
      Taro.redirectTo({
        url: `/pages/emergency/index?flowId=${followup.flowId}`,
      });
    }
  };

  const handleRecordMood = () => {
    Taro.switchTab({
      url: '/pages/mood/index',
    });
  };

  if (isLoading) {
    return (
      <View className="followup-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  if (!followup) {
    return (
      <View className="followup-page">
        <View className="no-session">
          <Text>跟进记录不存在</Text>
          <View className="btn btn-primary" onClick={handleGoHome}>
            返回首页
          </View>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <View className="followup-page">
        <View className="result-section">
          <View className="result-icon">
            {result.response === 'better' && '😊'}
            {result.response === 'okay' && '😐'}
            {result.response === 'still_bad' && '😔'}
          </View>
          <Text className="result-message">{result.message}</Text>

          {result.showCounselingSuggestion && (
            <View className="counseling-suggestion">
              <Text className="suggestion-title">专业支持建议</Text>
              <Text className="suggestion-content">
                如果你已经连续几天感觉不好，可能需要更多支持。可以考虑：
              </Text>
              <View className="suggestion-options">
                <Text className="suggestion-item">• 和信任的朋友或家人聊聊</Text>
                <Text className="suggestion-item">• 寻找专业心理咨询师</Text>
                <Text className="suggestion-item">• 拨打心理援助热线：400-161-9995</Text>
              </View>
            </View>
          )}

          <View className="result-actions">
            {result.response === 'better' && (
              <View className="btn btn-primary" onClick={handleGoHome}>
                继续保持
              </View>
            )}
            {result.response === 'okay' && (
              <>
                <View className="btn btn-secondary" onClick={handleRecordMood}>
                  记录今天的心情
                </View>
                <View className="btn btn-primary" onClick={handleGoHome}>
                  我知道了
                </View>
              </>
            )}
            {result.response === 'still_bad' && (
              <>
                <View className="btn btn-secondary" onClick={handleTryAgain}>
                  再试一次急救
                </View>
                <View className="btn btn-primary" onClick={handleGoHome}>
                  我知道了
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  const moodDisplay = getMoodDisplayName(followup.mood);
  const timeDisplay = formatTime(followup.createdAt);

  return (
    <View className="followup-page">
      <View className="followup-header">
        <Text className="followup-title">今天的感受</Text>
        <Text className="followup-subtitle">昨天你做了情绪急救，现在感觉怎么样？</Text>
      </View>

      <View className="session-summary">
        <View className="summary-item">
          <Text className="summary-label">情绪</Text>
          <Text className="summary-value">{moodDisplay}</Text>
        </View>
        <View className="summary-item">
          <Text className="summary-label">时间</Text>
          <Text className="summary-value">{timeDisplay}</Text>
        </View>
      </View>

      <View className="response-options">
        <View className="response-title">现在感觉怎么样？</View>

        <View
          className="response-option response-better"
          onClick={() => handleResponse('better')}
        >
          <Text className="response-emoji">😊</Text>
          <Text className="response-text">好一点了</Text>
          <Text className="response-desc">急救方法有效</Text>
        </View>

        <View
          className="response-option response-okay"
          onClick={() => handleResponse('okay')}
        >
          <Text className="response-emoji">😐</Text>
          <Text className="response-text">还行</Text>
          <Text className="response-desc">没什么变化</Text>
        </View>

        <View
          className="response-option response-bad"
          onClick={() => handleResponse('still_bad')}
        >
          <Text className="response-emoji">😔</Text>
          <Text className="response-text">还是不好</Text>
          <Text className="response-desc">需要更多支持</Text>
        </View>
      </View>

      <View className="followup-footer">
        <Text className="footer-text">你的反馈会帮助我们更好地支持你</Text>
      </View>
    </View>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  return `${month}月${day}日 ${hour}:${String(minute).padStart(2, '0')}`;
}