/**
 * 用户认证 Hook
 * 提供登录、登出、登录状态管理及自动初始化能力
 */
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * 用户认证 Hook
 * 提供登录、登出、登录状态管理及自动初始化能力
 */
export function useAuth(): UseAuthReturn {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    initialize,
    login,
    logout,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogin = async (): Promise<boolean> => {
    try {
      await login();
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      });
      Taro.reLaunch({ url: '/pages/index/index' });
      return true;
    } catch {
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
      return false;
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      Taro.showToast({
        title: '已退出登录',
        icon: 'success',
      });
    } catch {
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login: handleLogin,
    logout: handleLogout,
  };
}
