// 星寰海 v2.0 - 树洞页面
import { View, Text, ScrollView } from '@tarojs/components';
import React, { useEffect, useCallback } from 'react';
import { useTreeholeStore } from '../../stores/treeholeStore';
import TreeholePostCard from '../../components/TreeholePostCard';
import TreeholeNewPostModal from '../../components/TreeholeNewPostModal';
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

  // 加载初始帖子
  useEffect(() => {
    loadInitialPosts();
  }, []);

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    await loadInitialPosts();
    // 同步到云端
    await syncToCloud();
  }, [loadInitialPosts, syncToCloud]);

  // 触底加载更多
  const handleReachBottom = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadMorePosts();
    }
  }, [hasMore, loadingMore, loadMorePosts]);

  // 打开发帖弹窗
  const handleOpenNewPost = () => {
    openNewPostModal();
  };

  return (
    <View className="treehole-page">
      {/* 顶部标题栏 */}
      <View className="header">
        <Text className="title">深夜树洞</Text>
        <Text className="subtitle">在这里，你并不孤单</Text>
      </View>

      {/* 帖子列表 */}
      <ScrollView
        className="post-list"
        scrollY
        onScrollToLower={handleReachBottom}
        lowerThreshold={100}
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={handleRefresh}
      >
        {/* 加载状态 */}
        {loading && posts.length === 0 ? (
          <View className="loading-container">
            <Text className="loading-text">加载中...</Text>
          </View>
        ) : null}

        {/* 错误提示 */}
        {error && posts.length === 0 ? (
          <View className="error-container">
            <Text className="error-text">{error}</Text>
            <Text className="retry-text" onClick={loadInitialPosts}>
              点击重试
            </Text>
          </View>
        ) : null}

        {/* 帖子列表 */}
        {posts.map((post) => (
          <TreeholePostCard key={post.id} post={post} />
        ))}

        {/* 加载更多状态 */}
        {loadingMore ? (
          <View className="loading-more">
            <Text className="loading-more-text">加载更多...</Text>
          </View>
        ) : null}

        {/* 没有更多数据 */}
        {!hasMore && posts.length > 0 ? (
          <View className="no-more">
            <Text className="no-more-text">已经到底了~</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* 悬浮发帖按钮 */}
      <View className="fab-button" onClick={handleOpenNewPost}>
        <Text className="fab-icon">✍️</Text>
      </View>

      {/* 发帖弹窗 */}
      <TreeholeNewPostModal visible={isNewPostModalOpen} />
    </View>
  );
};

export default TreeholePage;
