// 星寰海 v2.0 - Zustand状态管理：认证
import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { supabaseAuth, STORAGE_KEYS } from '../config/supabase';
import { isTokenFormatValid } from '../utils/jwt';
import {
  requestAccountDeletion,
  cancelAccountDeletion as cancelDeletion,
  getDataPrivacyStatus,
} from '../services/dataPrivacyService';
import type {
  AccountDeletionReason,
  AccountDeletionResult,
  DataPrivacyStatus,
} from '../types/dataPrivacyTypes';

/** 用户信息 */
export interface UserProfile {
  id: string;
  openid: string;
  nickname?: string;
  avatarUrl?: string;
  createdAt?: string;
}

/** 登录结果 */
export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
}

/** 刷新 Token 结果 */
export interface RefreshTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

/** 认证状态 */
interface AuthState {
  token: string | null;
  refreshTokenValue: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  accountDeletionStatus: DataPrivacyStatus | null;

  initialize: () => Promise<void>;
  login: (code: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<RefreshTokenResult>;
  updateUser: (user: Partial<UserProfile>) => void;
  clearError: () => void;
  deleteAccount: (reason: AccountDeletionReason, customReason: string, confirmCode: string) => Promise<AccountDeletionResult>;
  cancelAccountDeletion: () => Promise<boolean>;
}

/** 从本地存储加载认证状态 */
function loadFromStorage(): {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
} {
  try {
    const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
    const refreshToken = Taro.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN);
    const userRaw = Taro.getStorageSync(STORAGE_KEYS.USER);

    let user: UserProfile | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw);
      } catch {
        user = null;
      }
    }

    return { token, refreshToken, user };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
}

/** 保存认证信息到本地存储 */
function saveToStorage(token: string, refreshToken: string, user: UserProfile): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.TOKEN, token);
    Taro.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    Taro.setStorageSync(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
  }
}

/** 清除本地存储的认证信息 */
function clearStorage(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.TOKEN);
    Taro.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN);
    Taro.removeStorageSync(STORAGE_KEYS.USER);
  } catch (err) {
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshTokenValue: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  accountDeletionStatus: null,

  /** 初始化：从本地存储加载认证状态 */
  initialize: async () => {
    const { token, refreshToken, user } = loadFromStorage();

    if (token && user) {
      // 验证 Token 是否有效
      const isValid = isTokenFormatValid(token);

      if (isValid) {
        set({
          token,
          refreshTokenValue: refreshToken,
          user,
          isAuthenticated: true,
        });
      } else {
        // Token 无效，尝试刷新
        if (refreshToken) {
          const result = await get().refreshAuthToken();
          if (result.success && result.token) {
            set({
              token: result.token,
              user,
              isAuthenticated: true,
            });
          } else {
            clearStorage();
            set({ token: null, refreshTokenValue: null, user: null, isAuthenticated: false });
          }
        } else {
          clearStorage();
          set({ token: null, refreshTokenValue: null, user: null, isAuthenticated: false });
        }
      }
    }
  },

  /** 登录 */
  login: async (code: string) => {
    set({ loading: true, error: null });

    try {
      const result = await supabaseAuth.loginWithCode(code);

      if (result.success && result.token && result.user) {
        saveToStorage(result.token, result.refreshToken || '', result.user);

        set({
          token: result.token,
          refreshTokenValue: result.refreshToken || null,
          user: result.user,
          isAuthenticated: true,
          loading: false,
        });

        return { success: true, user: result.user };
      }

      set({
        loading: false,
        error: result.error || '登录失败',
      });

      return { success: false, error: result.error };
    } catch (err) {
      const error = err instanceof Error ? err.message : '登录失败';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  /** 登出 */
  logout: async () => {
    set({ loading: true });

    try {
      await supabaseAuth.logout();
      clearStorage();

      set({
        token: null,
        refreshTokenValue: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch (err) {
      clearStorage();

      set({
        token: null,
        refreshTokenValue: null,
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  /** 刷新 Token */
  refreshAuthToken: async () => {
    const { refreshTokenValue } = get();

    if (!refreshTokenValue) {
      return { success: false, error: '缺少 refresh token' };
    }

    try {
      const result = await supabaseAuth.refreshToken(refreshTokenValue);

      if (result.success && result.token) {
        const { user } = get();
        saveToStorage(result.token, refreshTokenValue, user!);

        set({ token: result.token });
        return { success: true, token: result.token };
      }

      return { success: false, error: result.error };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '刷新 token 失败',
      };
    }
  },

  /** 更新用户信息 */
  updateUser: (updates: Partial<UserProfile>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };

    try {
      Taro.setStorageSync(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    } catch (err) {
    }

    set({ user: updatedUser });
  },

  /** 清除错误 */
  clearError: () => {
    set({ error: null });
  },

  deleteAccount: async (reason: AccountDeletionReason, customReason: string, confirmCode: string) => {
    const userId = get().user?.id;
    if (!userId) {
      return { success: false, error: '未登录', gracePeriodDays: 30 };
    }

    const result = await requestAccountDeletion(userId, { reason, customReason, confirmCode });
    if (result.success) {
      set({ accountDeletionStatus: getDataPrivacyStatus() });
    }
    return result;
  },

  cancelAccountDeletion: async () => {
    const userId = get().user?.id;
    if (!userId) return false;

    const success = await cancelDeletion(userId);
    if (success) {
      set({ accountDeletionStatus: getDataPrivacyStatus() });
    }
    return success;
  },
}));
