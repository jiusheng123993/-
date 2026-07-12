// 星寰海 v2.0 - 树洞回复列表组件
import { View, Text, Textarea } from '@tarojs/components';
import React, { useState, useEffect } from 'react';
import { TreeholeReply } from '../services/treeholeService';
import { useTreeholeStore } from '../stores/treeholeStore';
import './TreeholeReplyList.scss';

interface TreeholeReplyListProps {
  postId: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffMs / 86400000);
  return `${diffDays}天前`;
}

const TreeholeReplyList: React.FC<TreeholeReplyListProps> = ({ postId }) => {
  const [replies, setReplies] = useState<TreeholeReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(false);
  const getReplies = useTreeholeStore((s) => s.getReplies);
  const submitReply = useTreeholeStore((s) => s.submitReply);

  useEffect(() => {
    loadReplies();
  }, [postId]);

  const loadReplies = async () => {
    setLoading(true);
    const data = await getReplies(postId);
    setReplies(data);
    setLoading(false);
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;

    await submitReply(postId, newReply);
    setNewReply('');
    // 重新加载回复列表
    await loadReplies();
  };

  return (
    <View className="reply-list">
      {/* 已有回复 */}
      <View className="replies-section">
        {loading ? (
          <Text className="loading-text">加载回复中...</Text>
        ) : replies.length === 0 ? (
          <Text className="empty-text">还没有人回复，来说一句吧~</Text>
        ) : (
          replies.map((reply) => (
            <View key={reply.id} className="reply-item">
              <View className="reply-header">
                <Text className="reply-author">匿名用户</Text>
                <Text className="reply-time">{formatTime(reply.createdAt)}</Text>
              </View>
              <Text className="reply-content">{reply.content}</Text>
              {reply.isAi && (
                <View className="ai-badge">
                  <Text className="ai-badge-text">AI回应</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* 添加回复 */}
      <View className="add-reply">
        <Textarea
          className="reply-input"
          placeholder="写下你的回复（最多200字）..."
          value={newReply}
          onInput={(e) => setNewReply(e.detail.value)}
          maxlength={200}
          autoHeight
        />
        <View
          className="submit-btn"
          onClick={handleSubmitReply}
        >
          <Text className="submit-text">发送</Text>
        </View>
      </View>
    </View>
  );
};

export default TreeholeReplyList;
