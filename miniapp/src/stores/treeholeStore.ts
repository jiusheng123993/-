// 星寰海 v2.0 - Zustand状态管理：树洞
import { create } from 'zustand';
import {
  getTreeholeFeed,
  createTreeholePost,
  addEmpathy,
  addReply,
  syncLocalPosts,
  TreeholePost,
  TreeholeReply,
} from '../services/treeholeService';

/** 回复列表缓存 */
const replyCache = new Map<string, TreeholeReply[]>();

interface TreeholeStoreState {
  // 帖子列表
  posts: TreeholePost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;

  // 加载状态
  loading: boolean;
  loadingMore: boolean;
  error: string | null;

  // 发帖弹窗
  isNewPostModalOpen: boolean;

  // 方法
  loadInitialPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;

  openNewPostModal: () => void;
  closeNewPostModal: () => void;

  submitNewPost: (content: string, moodTag?: string) => Promise<TreeholePost | null>;

  handleEmpathy: (postId: string) => Promise<void>;

  getReplies: (postId: string) => Promise<TreeholeReply[]>;
  submitReply: (postId: string, content: string) => Promise<void>;

  syncToCloud: () => Promise<void>;
  clearAllData: () => void;
}

export const useTreeholeStore = create<TreeholeStoreState>((set, get) => ({
  posts: [],
  total: 0,
  page: 1,
  pageSize: 10,
  hasMore: true,

  loading: false,
  loadingMore: false,
  error: null,

  isNewPostModalOpen: false,

  loadInitialPosts: async () => {
    set({ loading: true, error: null });
    try {
      const result = await getTreeholeFeed({ page: 1, pageSize: get().pageSize });
      set({
        posts: result.posts,
        total: result.total,
        page: 1,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('[TreeholeStore] 加载初始帖子失败:', error);
      set({
        loading: false,
        error: '加载失败，请检查网络连接',
      });
    }
  },

  loadMorePosts: async () => {
    if (!get().hasMore || get().loadingMore) return;

    set({ loadingMore: true, error: null });
    try {
      const nextPage = get().page + 1;
      const result = await getTreeholeFeed({ page: nextPage, pageSize: get().pageSize });

      set((state) => ({
        posts: [...state.posts, ...result.posts],
        total: result.total,
        page: nextPage,
        hasMore: result.hasMore,
        loadingMore: false,
      }));
    } catch (error) {
      console.error('[TreeholeStore] 加载更多帖子失败:', error);
      set({
        loadingMore: false,
        error: '加载更多失败',
      });
    }
  },

  refreshPosts: async () => {
    set({ loading: true, error: null });
    try {
      const result = await getTreeholeFeed({ page: 1, pageSize: get().pageSize });
      set({
        posts: result.posts,
        total: result.total,
        page: 1,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      console.error('[TreeholeStore] 刷新帖子失败:', error);
      set({
        loading: false,
        error: '刷新失败',
      });
    }
  },

  openNewPostModal: () => set({ isNewPostModalOpen: true }),
  closeNewPostModal: () => set({ isNewPostModalOpen: false }),

  submitNewPost: async (content, moodTag) => {
    if (!content || content.trim().length === 0) {
      return null;
    }

    try {
      const post = await createTreeholePost(content.trim(), moodTag);
      set((state) => ({
        posts: [post, ...state.posts],
        total: state.total + 1,
        isNewPostModalOpen: false,
      }));
      return post;
    } catch (error) {
      console.error('[TreeholeStore] 发布帖子失败:', error);
      set({ error: '发布失败，请重试' });
      return null;
    }
  },

  handleEmpathy: async (postId) => {
    try {
      await addEmpathy(postId);
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, empathyCount: p.empathyCount + 1 } : p
        ),
      }));
    } catch (error) {
      console.error('[TreeholeStore] 点赞失败:', error);
    }
  },

  getReplies: async (postId) => {
    // 先检查缓存
    if (replyCache.has(postId)) {
      return replyCache.get(postId)!;
    }

    try {
      const replies = await import('../services/treeholeService').then(m => m.getPostReplies(postId));
      replyCache.set(postId, replies);
      return replies;
    } catch (error) {
      console.error('[TreeholeStore] 获取回复失败:', error);
      return [];
    }
  },

  submitReply: async (postId, content) => {
    if (!content || content.trim().length === 0) return;

    try {
      await addReply(postId, content.trim());
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, replyCount: p.replyCount + 1 } : p
        ),
      }));
      // 清除该帖子的回复缓存，下次获取时重新加载
      replyCache.delete(postId);
    } catch (error) {
      console.error('[TreeholeStore] 添加回复失败:', error);
    }
  },

  syncToCloud: async () => {
    try {
      await syncLocalPosts();
    } catch (error) {
      console.error('[TreeholeStore] 同步到云端失败:', error);
    }
  },

  clearAllData: () => {
    replyCache.clear();
    set({
      posts: [],
      total: 0,
      page: 1,
      hasMore: true,
      error: null,
    });
  },
}));
