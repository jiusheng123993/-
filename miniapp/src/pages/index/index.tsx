// 星寰海 v2.0 - 首页
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface HomePageProps {
  onMoodSelect?: (mood: string) => void;
}

export function HomePage({ onMoodSelect }: HomePageProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // 5个主要情绪入口
  const mainEmotions = [
    { key: 'sad', label: '我好难过', color: '#4fc3f7' },
    { key: 'anxious', label: '我好焦虑', color: '#ff8a65' },
    { key: 'tired', label: '我好累', color: '#9fa8da' },
    { key: 'lonely', label: '我好孤独', color: '#80deea' },
    { key: 'unclear', label: '我说不出来', color: '#ce93d8' }
  ];

  const handleEmotionClick = (flowId: string, mood: string) => {
    setSelectedMood(mood);
    if (onMoodSelect) {
      onMoodSelect(mood);
    }
    // 导航到紧急页面，传递flowId
    Taro.navigateTo({ url: `/pages/emergency/index?flowId=${flowId}` });
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* 主标题 */}
        <h1 className="home-title">你怎么了？</h1>

        {/* 副标题 */}
        <p className="home-subtitle">选一个最接近的，我们慢慢聊</p>

        {/* 情绪选择按钮 */}
        <div className="emotion-buttons">
          {mainEmotions.map((emotion) => (
            <button
              key={emotion.key}
              className={`emotion-btn ${selectedMood === emotion.key ? 'selected' : ''}`}
              style={{ backgroundColor: emotion.color }}
              onClick={() => handleEmotionClick(emotion.key, emotion.key)}
            >
              <span className="emotion-label">{emotion.label}</span>
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <p className="home-footer">
          这里没有评判，只有倾听
        </p>
      </div>
    </div>
  );
}
