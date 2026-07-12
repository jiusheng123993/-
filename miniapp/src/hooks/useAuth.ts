// 星寰海 v2.0 - 认证状态Hook
import { useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useAuthStore, type UserProfile } from '../stores/authStore';
import { isTokenExpiringSoon } from '../utils/jwt';

/** 认证Hook返回值 */
interface UseAuthReturn {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * 认证状态管理Hook
 * @returns 认证状态和方法
 */
export function useAuth(): UseAuthReturn {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    token,
    initialize,
    login,
    logout,
    refreshAuthToken,
    clearError,
  } = useAuthStore();

  // 初始化：从本地存储加载认证状态
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 自动刷新即将过期的 Token
  useEffect(() => {
    if (!token) return;

    const checkAndRefresh = async () => {
      if (isTokenExpiringSoon(token)) {
        console.log('[useAuth] Token 即将过期，尝试刷新');
        await refreshAuthToken();
      }
    };

    // 每分钟检查一次
    const intervalId = setInterval(checkAndRefresh, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token, refreshAuthToken]);

  /** 登录 */
  const handleLogin = async (): Promise<boolean> => {
    try {
      // 调用 Taro.login() 获取微信 code
      const loginRes = await Taro.login();

      if (!loginRes.code) {
        Taro.showToast({
          title: '获取微信登录凭证失败',
          icon: 'none',
        });
        return false;
      }

      // 使用 store 中的 login 方法处理登录
      const result = await login(loginRes.code);

      if (result.success) {
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
        });

        // 跳转到首页
        Taro.switchTab({ url: '/pages/index/index' });
        return true;
      } else {
        Taro.showToast({
          title: result.error || '登录失败',
          icon: 'none',
        });
        return false;
      }
    } catch (err) {
      console.error('[useAuth] 登录失败:', err);
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none',
      });
      return false;
    }
  };

  /** 登出 */
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      Taro.showToast({
        title: '已退出登录',
        icon: 'success',
      });
    } catch (err) {
      console.error('[useAuth] 登出失败:', err);
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    clearError,
  };
}
