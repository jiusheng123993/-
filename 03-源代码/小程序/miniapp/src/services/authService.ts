/**
 * 认证服务
 *
 * 微信登录（code 换取 token）、用户信息获取、Token 刷新、退出登录
 */
// 星河宠记 v2.0 - 认证服务
import Taro from '@tarojs/taro';
import { api } from './api';
import { storage } from '../utils/storage';
import type { User as UserProfile } from '../types';

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

    // 2. 将 code 发送到后端换取 token
    const result = await api.post<{ token: string; user: { id: string; nickname?: string; avatarUrl?: string } }>(
      '/api/auth/login',
      { provider: 'wechat', code }
    );

    if (result.token && result.user) {
      const user: UserProfile = {
        id: result.user.id,
        nickname: result.user.nickname ?? '',
        avatar: result.user.avatarUrl ?? '',
        createdAt: new Date().toISOString(),
      };
      storage.setToken(result.token);
      return {
        success: true,
        token: result.token,
        user,
      };
    }

    return { success: false, error: '登录失败' };
  } catch (err) {
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
    const raw = await api.get<{ id: string; nickname?: string; avatarUrl?: string }>('/api/auth/profile');

    if (raw) {
      const user: UserProfile = {
        id: raw.id,
        nickname: raw.nickname ?? '',
        avatar: raw.avatarUrl ?? '',
        createdAt: new Date().toISOString(),
      };
      return user;
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * 刷新 Token（当前后端未提供专用刷新端点，保留接口兼容）
 */
export async function refreshToken(refreshToken: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const result = await api.post<{ token: string }>('/api/auth/refresh', { refreshToken });
    if (result.token) {
      storage.setToken(result.token);
      return { success: true, token: result.token };
    }
    return { success: false, error: '刷新失败' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : '刷新 Token 失败',
    };
  }
}

/**
 * 绑定手机号（微信 getPhoneNumber）
 * @param code - 微信手机号授权码
 * @returns 绑定结果，成功时返回脱敏手机号后4位
 */
export async function bindPhone(code: string): Promise<{ success: boolean; phone?: string }> {
  try {
    const result = await api.post<{ success: boolean; data?: { phone: string } }>(
      '/api/auth/bind-phone',
      { code },
    );
    return { success: result.success, phone: result.data?.phone };
  } catch {
    return { success: false };
  }
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  storage.removeToken();
}
