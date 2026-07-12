// 星寰海 v2.0 - 树洞API服务层
import Taro from '@tarojs/taro';
import { api } from './api';

/** 树洞帖子 */
export interface TreeholePost {
  id: string;
  content: string;
  moodTag?: string;
  intensity?: number;
  empathyCount: number;
  replyCount: number;
  isHighRisk: boolean;
  createdAt: string;
}

/** 树洞回复 */
export interface TreeholeReply {
  id: string;
  postId: string;
  content: string;
  isAi: boolean;
  createdAt: string;
}

/** 分页参数 */
interface PaginationParams {
  page: number;
  pageSize: number;
}

/** 获取树洞信息流 */
export async function getTreeholeFeed(params: PaginationParams): Promise<{
  posts: TreeholePost[];
  hasMore: boolean;
  total: number;
}> {
  try {
    const result = await api.get<{ posts: TreeholePost[]; hasMore: boolean; total: number }>(
      `/api/treehole/feed?page=${params.page}&pageSize=${params.pageSize}`
    );
    return result;
  } catch (error) {
    console.error('[TreeholeService] 获取信息流失败:', error);
    // 降级到本地存储
    return getLocalFeed(params);
  }
}

/** 从本地存储获取信息流（离线模式） */
function getLocalFeed(params: PaginationParams): Promise<{
  posts: TreeholePost[];
  hasMore: boolean;
  total: number;
}> {
  return new Promise((resolve) => {
    const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
    if (!localPosts || localPosts.length === 0) {
      resolve({ posts: [], hasMore: false, total: 0 });
      return;
    }

    const start = (params.page - 1) * params.pageSize;
    const end = start + params.pageSize;
    const posts = localPosts.slice(start, end);
    const hasMore = end < localPosts.length;

    resolve({ posts, hasMore, total: localPosts.length });
  });
}

/** 发布树洞帖子 */
export async function createTreeholePost(content: string, moodTag?: string): Promise<TreeholePost> {
  const post: Omit<TreeholePost, 'id' | 'createdAt'> = {
    content,
    moodTag,
    empathyCount: 0,
    replyCount: 0,
    isHighRisk: false,
  };

  try {
    const result = await api.post<TreeholePost>('/api/treehole/posts', post);
    // 保存到本地存储
    const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
    if (localPosts) {
      Taro.setStorageSync('xhh_treehole_posts', [result, ...localPosts]);
    } else {
      Taro.setStorageSync('xhh_treehole_posts', [result]);
    }
    return result;
  } catch (error) {
    console.error('[TreeholeService] 发布帖子失败:', error);
    // 离线模式：直接保存到本地
    const offlinePost: TreeholePost = {
      id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...post,
      createdAt: new Date().toISOString(),
    };
    const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
    if (localPosts) {
      Taro.setStorageSync('xhh_treehole_posts', [offlinePost, ...localPosts]);
    } else {
      Taro.setStorageSync('xhh_treehole_posts', [offlinePost]);
    }
    return offlinePost;
  }
}

/** 点赞（匿名抱抱） */
export async function addEmpathy(postId: string): Promise<void> {
  try {
    await api.post(`/api/treehole/posts/${postId}/empathy`);
    // 更新本地存储
    const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
    if (localPosts) {
      const updated = localPosts.map(p =>
        p.id === postId ? { ...p, empathyCount: p.empathyCount + 1 } : p
      );
      Taro.setStorageSync('xhh_treehole_posts', updated);
    }
  } catch (error) {
    console.error('[TreeholeService] 点赞失败:', error);
    // 离线模式：只更新本地
    const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
    if (localPosts) {
      const updated = localPosts.map(p =>
        p.id === postId ? { ...p, empathyCount: p.empathyCount + 1 } : p
      );
      Taro.setStorageSync('xhh_treehole_posts', updated);
    }
  }
}

/** 获取帖子回复列表 */
export async function getPostReplies(postId: string): Promise<TreeholeReply[]> {
  try {
    const result = await api.get<TreeholeReply[]>(`/api/treehole/posts/${postId}/replies`);
    return result;
  } catch (error) {
    console.error('[TreeholeService] 获取回复失败:', error);
    // 返回空数组
    return [];
  }
}

/** 添加回复 */
export async function addReply(postId: string, content: string): Promise<TreeholeReply> {
  try {
    const result = await api.post<TreeholeReply>(`/api/treehole/posts/${postId}/reply`, { content });
    // 更新本地存储的回复数
    const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
    if (localPosts) {
      const updated = localPosts.map(p =>
        p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p
      );
      Taro.setStorageSync('xhh_treehole_posts', updated);
    }
    return result;
  } catch (error) {
    console.error('[TreeholeService] 添加回复失败:', error);
    // 离线模式：返回模拟数据
    return {
      id: `offline_reply_${Date.now()}`,
      postId,
      content,
      isAi: false,
      createdAt: new Date().toISOString(),
    };
  }
}

/** 同步本地数据到云端 */
export async function syncLocalPosts(): Promise<void> {
  const localPosts = Taro.getStorageSync('xhh_treehole_posts') as TreeholePost[] | null;
  if (!localPosts || localPosts.length === 0) return;

  // 找出离线创建的帖子
  const offlinePosts = localPosts.filter(p => p.id.startsWith('offline_'));
  if (offlinePosts.length === 0) return;

  try {
    for (const post of offlinePosts) {
      // 尝试上传到云端
      await api.post('/api/treehole/posts', {
        content: post.content,
        moodTag: post.moodTag,
      });
    }
    // 上传成功后，移除离线标记并重新排序
    const onlinePosts = localPosts.filter(p => !p.id.startsWith('offline_'));
    Taro.setStorageSync('xhh_treehole_posts', onlinePosts);
  } catch (error) {
    console.error('[TreeholeService] 同步失败:', error);
  }
}
