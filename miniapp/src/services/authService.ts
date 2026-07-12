// 星寰海 v2.0 - 认证服务
import Taro from '@tarojs/taro';
import { supabaseAuth } from '../config/supabase';
import type { UserProfile } from '../stores/authStore';

/** 登录结果 */
export interface LoginResult {
  success: boolean;
  token?: string;
  user?: UserProfile;
  error?: string;
}

/**
 * 微信登录：获取 code 并换取 token
 */
export async function loginWithCode(): Promise<LoginResult> {
  try {
    // 1. 调用 Taro.login() 获取微信临时凭证 code
    const { code } = await Taro.login();

    if (!code) {
      return { success: false, error: '未获取到微信登录凭证' };
    }

    // 2. 将 code 发送到后端换取 openid 和 token
    const result = await supabaseAuth.loginWithCode(code);

    if (result.success && result.token && result.user) {
      return {
        success: true,
        token: result.token,
        user: result.user,
      };
    }

    return { success: false, error: result.error || '登录失败' };
  } catch (err) {
    console.error('[AuthService] 登录失败:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '登录失败',
    };
  }
}

/**
 * 获取用户信息
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const result = await supabaseAuth.getUserProfile(userId);

    if (result.success && result.user) {
      return result.user;
    }

    return null;
  } catch (err) {
    console.error('[AuthService] 获取用户信息失败:', err);
    return null;
  }
}

/**
 * 刷新 Token
 */
export async function refreshToken(refreshToken: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const result = await supabaseAuth.refreshToken(refreshToken);
    return result;
  } catch (err) {
    console.error('[AuthService] 刷新 Token 失败:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '刷新 Token 失败',
    };
  }
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  await supabaseAuth.logout();
}
