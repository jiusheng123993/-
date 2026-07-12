// 星寰海 v2.0 - 树洞帖子卡片组件
import { View, Text } from '@tarojs/components';
import React, { useState } from 'react';
import { TreeholePost } from '../services/treeholeService';
import { useTreeholeStore } from '../stores/treeholeStore';
import TreeholeReplyList from './TreeholeReplyList';
import './TreeholePostCard.scss';

interface TreeholePostCardProps {
  post: TreeholePost;
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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

const TreeholePostCard: React.FC<TreeholePostCardProps> = ({ post }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [empathyAnimating, setEmpathyAnimating] = useState(false);
  const handleEmpathy = useTreeholeStore((s) => s.handleEmpathy);

  const handleEmpathyClick = async () => {
    setEmpathyAnimating(true);
    await handleEmpathy(post.id);
    setTimeout(() => setEmpathyAnimating(false), 500);
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const tagColor = post.moodTag ? moodTagColors[post.moodTag] || '#6C5CE7' : '#6C5CE7';

  return (
    <View className={`post-card ${empathyAnimating ? 'empathy-animating' : ''}`}>
      {/* 内容区域 */}
      <View className="post-content">
        <Text className="post-text">{post.content}</Text>
      </View>

      {/* 标签和时间 */}
      <View className="post-meta">
        {post.moodTag && (
          <View className="mood-tag" style={{ backgroundColor: tagColor }}>
            <Text className="mood-tag-text">{post.moodTag}</Text>
          </View>
        )}
        <Text className="post-time">{formatTime(post.createdAt)}</Text>
      </View>

      {/* 互动按钮 */}
      <View className="post-actions">
        <View className="action-btn empathy-btn" onClick={handleEmpathyClick}>
          <Text className="action-icon">🤝</Text>
          <Text className="action-count">{post.empathyCount}</Text>
          <Text className="action-label">匿名抱抱</Text>
        </View>

        <View className="action-btn reply-btn" onClick={handleToggleReplies}>
          <Text className="action-icon">💬</Text>
          <Text className="action-count">{post.replyCount}</Text>
          <Text className="action-label">回复</Text>
        </View>
      </View>

      {/* 回复列表 */}
      {showReplies && (
        <View className="replies-container">
          <TreeholeReplyList postId={post.id} />
        </View>
      )}
    </View>
  );
};

export default TreeholePostCard;
