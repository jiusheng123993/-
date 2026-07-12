// 星寰海 v2.0 - 树洞发帖弹窗组件
import { View, Text, Textarea } from '@tarojs/components';
import React, { useState, useEffect } from 'react';
import { useTreeholeStore } from '../stores/treeholeStore';
import { useCrisisDetection } from '../hooks/useCrisisDetection';
import { MOOD_TAGS } from '../data/moodTags';
import './TreeholeNewPostModal.scss';

interface TreeholeNewPostModalProps {
  visible: boolean;
}

const moodTagColors: Record<string, string> = {
  '焦虑': '#FF6B6B',
  '低落': '#4ECDC4',
  '愤怒': '#FF8E53',
  '孤独': '#A78BFA',
  '疲惫': '#F9CA24',
  '无力': '#6C5CE7',
  '迷茫': '#00D2D3',
  '委屈': '#FD79A8',
  '烦躁': '#FDCB6E',
  '空虚': '#636E72',
  '开心': '#00B894',
  '兴奋': '#FDCB6E',
  '感恩': '#55EFC4',
  '满足': '#81ECEC',
  '期待': '#74B9FF',
  '自豪': '#A29BFE',
  '放松': '#55EFC4',
  '被爱': '#FD79A8',
};

const TreeholeNewPostModal: React.FC<TreeholeNewPostModalProps> = ({ visible }) => {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'safe' | 'mild' | 'moderate' | 'severe'>('safe');
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  const submitNewPost = useTreeholeStore((s) => s.submitNewPost);
  const closeNewPostModal = useTreeholeStore((s) => s.closeNewPostModal);
  const crisisHook = useCrisisDetection();

  // 危机检测
  useEffect(() => {
    if (content.length > 0) {
      const result = crisisHook.detect(content);
      if (result.detected) {
        setCrisisLevel(result.level);
        setShowCrisisAlert(true);
      } else {
        setCrisisLevel('safe');
        setShowCrisisAlert(false);
      }
    } else {
      setCrisisLevel('safe');
      setShowCrisisAlert(false);
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitNewPost(content, selectedMood);
      setContent('');
      setSelectedMood(undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent('');
      setSelectedMood(undefined);
      closeNewPostModal();
    }
  };

  if (!visible) return null;

  const canSubmit = content.trim() && !isSubmitting && crisisLevel !== 'severe';

  return (
    <View className="modal-overlay" onClick={handleClose}>
      <View className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <View className="modal-header">
          <Text className="modal-title">深夜树洞</Text>
          <Text className="modal-close" onClick={handleClose}>✕</Text>
        </View>

        {/* 内容输入 */}
        <View className="modal-body">
          <Textarea
            className="post-textarea"
            placeholder="在这里写下你的心情..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
            autoHeight
            focus={visible}
          />
          <Text className="char-count">{content.length}/500</Text>

          {/* 情绪标签选择 */}
          <View className="mood-selector">
            <Text className="mood-label">当前心情（可选）：</Text>
            <View className="mood-tags">
              {MOOD_TAGS.map((tag) => (
                <View
                  key={tag.key}
                  className={`mood-tag ${selectedMood === tag.label ? 'selected' : ''}`}
                  style={{
                    backgroundColor: selectedMood === tag.label ? moodTagColors[tag.label] || '#6C5CE7' : 'rgba(255,255,255,0.1)',
                    borderColor: selectedMood === tag.label ? moodTagColors[tag.label] || '#6C5CE7' : 'transparent',
                  }}
                  onClick={() => setSelectedMood(tag.label)}
                >
                  <Text className="mood-tag-text" style={{ color: selectedMood === tag.label ? 'white' : '#e0e0e0' }}>
                    {tag.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 危机干预提示 */}
          {showCrisisAlert && crisisLevel !== 'safe' && (
            <View className={`crisis-alert crisis-${crisisLevel}`}>
              <Text className="crisis-icon">⚠️</Text>
              <Text className="crisis-text">
                {crisisLevel === 'mild' && '我注意到你可能正在经历一些困难...'}
                {crisisLevel === 'moderate' && '我很担心你的状态，请先看看这些资源...'}
                {crisisLevel === 'severe' && '我非常担心你的安全！请立即联系帮助热线...'}
              </Text>
            </View>
          )}
        </View>

        {/* 底部按钮 */}
        <View className="modal-footer">
          <View className="cancel-btn" onClick={handleClose}>
            <Text className="cancel-text">取消</Text>
          </View>
          <View
            className={`submit-btn ${!canSubmit ? 'disabled' : ''}`}
            onClick={handleSubmit}
          >
            <Text className="submit-text">发布</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TreeholeNewPostModal;
