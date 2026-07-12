import { View, Text, ScrollView } from '@tarojs/components';
import React, { useEffect, useCallback } from 'react';
import { useTreeholeStore } from '../../../stores/treeholeStore';
import TreeholePostCard from '../../../components/TreeholePostCard';
import TreeholeNewPostModal from '../../../components/TreeholeNewPostModal';
import './index.scss';

const TreeholePage: React.FC = () => {
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    isNewPostModalOpen,
    loadInitialPosts,
    loadMorePosts,
    openNewPostModal,
    syncToCloud,
  } = useTreeholeStore();

  useEffect(() => {
    loadInitialPosts();
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadInitialPosts();
    await syncToCloud();
  }, [loadInitialPosts, syncToCloud]);

  const handleReachBottom = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadMorePosts();
    }
  }, [hasMore, loadingMore, loadMorePosts]);

  const handleOpenNewPost = () => {
    openNewPostModal();
  };

  return (
    <View className="treehole-page">
      <View className="header">
        <Text className="title">深夜树洞</Text>
        <Text className="subtitle">在这里，你并不孤单</Text>
      </View>

      <ScrollView
        className="post-list"
        scrollY
        onScrollToLower={handleReachBottom}
        lowerThreshold={100}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={handleRefresh}
      >
        {loading && posts.length === 0 ? (
          <View className="loading-container">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : null}

        {error && posts.length === 0 ? (
          <View className="error-container">
            <Text className="error-text">{error}</Text>
            <Text className="retry-text" onClick={loadInitialPosts}>
              点击重试
            </Text>
          </View>
        ) : null}

        {posts.map((post) => (
          <TreeholePostCard key={post.id} post={post} />
        ))}

        {loadingMore ? (
          <View className="loading-more">
            <Text className="loading-more-text">加载更多...</Text>
          </View>
        ) : null}

        {!hasMore && posts.length > 0 ? (
          <View className="no-more">
            <Text className="no-more-text">已经到底了~</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="fab-button" onClick={handleOpenNewPost}>
        <Text className="fab-icon">✍️</Text>
      </View>

      <TreeholeNewPostModal visible={isNewPostModalOpen} />
    </View>
  );
};

export default TreeholePage;
