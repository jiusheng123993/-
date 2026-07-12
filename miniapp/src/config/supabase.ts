// 星寰海 v2.0 - Supabase 客户端配置（MVP Mock模式）
import Taro from '@tarojs/taro';

/** 环境配置 */
export const ENV = {
  development: {
    supabaseUrl: 'https://mock-supabase.example.com',
    supabaseKey: 'mock-key',
    useMock: true,
  },
  production: {
    supabaseUrl: '',
    supabaseKey: '',
    useMock: false,
  },
};

/** 当前环境（默认开发环境） */
const currentEnv = ENV.development;

/** JWT Token 过期时间（秒） */
export const TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7天

/** 存储键名 */
export const STORAGE_KEYS = {
  TOKEN: 'xhh_token',
  USER: 'xhh_user',
  REFRESH_TOKEN: 'xhh_refresh_token',
} as const;

/** Mock 用户数据存储（仅用于开发测试） */
interface MockUser {
  id: string;
  openid: string;
  nickname?: string;
  avatarUrl?: string;
  createdAt: number;
}

const mockUsers: Record<string, MockUser> = {};

/** 生成唯一 ID */
function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Supabase 认证服务（Mock 实现）
 * MVP 阶段使用本地存储模拟，生产环境切换为真实 API
 */
export class SupabaseAuthService {
  private static instance: SupabaseAuthService;

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  /**
   * 微信登录：用 code 换取 openid 和 token
   * @param code 微信登录临时凭证
   */
  async loginWithCode(code: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    user?: {
      id: string;
      openid: string;
      nickname?: string;
      avatarUrl?: string;
    };
    error?: string;
  }> {
    try {
      if (currentEnv.useMock) {
        // Mock 模式：直接返回模拟数据
        const existingUser = Object.values(mockUsers).find(u => u.openid === code);

        if (existingUser) {
          return this.generateTokens(existingUser);
        }

        // 新用户
        const newUser: MockUser = {
          id: generateId(),
          openid: code,
          nickname: '星寰海用户',
          avatarUrl: '',
          createdAt: Date.now(),
        };
        mockUsers[newUser.id] = newUser;

        return this.generateTokens(newUser);
      }

      // 生产环境：调用真实 Supabase API
      const res = await Taro.request({
        url: `${currentEnv.supabaseUrl}/auth/v1/token`,
        method: 'POST',
        data: {
          grant_type: 'password',
          code,
        },
        header: {
          'apikey': currentEnv.supabaseKey,
          'Content-Type': 'application/json',
        },
      });

      if (res.statusCode === 200) {
        const { access_token, refresh_token, user } = res.data;
        return {
          success: true,
          token: access_token,
          refreshToken: refresh_token,
          user: {
            id: user.id,
            openid: user.app_metadata?.provider === 'wechat' ? user.app_metadata.provider_id : '',
            nickname: user.user_metadata?.name || user.email,
            avatarUrl: user.user_metadata?.avatar_url,
          },
        };
      }

      return { success: false, error: `API错误: ${res.statusCode}` };
    } catch (err) {
      console.error('[SupabaseAuth] 登录失败:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : '登录失败',
      };
    }
  }

  /**
   * 获取用户信息
   */
  async getUserProfile(userId: string): Promise<{
    success: boolean;
    user?: {
      id: string;
      openid: string;
      nickname?: string;
      avatarUrl?: string;
    };
    error?: string;
  }> {
    try {
      if (currentEnv.useMock) {
        const user = Object.values(mockUsers).find(u => u.id === userId);
        if (user) {
          return {
            success: true,
            user: {
              id: user.id,
              openid: user.openid,
              nickname: user.nickname,
              avatarUrl: user.avatarUrl,
            },
          };
        }
        return { success: false, error: '用户不存在' };
      }

      // 生产环境
      const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
      const res = await Taro.request({
        url: `${currentEnv.supabaseUrl}/auth/v1/user`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`,
          'apikey': currentEnv.supabaseKey,
        },
      });

      if (res.statusCode === 200) {
        const user = res.data;
        return {
          success: true,
          user: {
            id: user.id,
            openid: user.app_metadata?.provider_id || '',
            nickname: user.user_metadata?.name || user.email,
            avatarUrl: user.user_metadata?.avatar_url,
          },
        };
      }

      return { success: false, error: `API错误: ${res.statusCode}` };
    } catch (err) {
      console.error('[SupabaseAuth] 获取用户信息失败:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : '获取用户信息失败',
      };
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      if (currentEnv.useMock) {
        // Mock 模式：直接返回新 token
        const token = this.generateMockToken();
        return { success: true, token };
      }

      // 生产环境
      const res = await Taro.request({
        url: `${currentEnv.supabaseUrl}/auth/v1/token`,
        method: 'POST',
        data: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        header: {
          'apikey': currentEnv.supabaseKey,
          'Content-Type': 'application/json',
        },
      });

      if (res.statusCode === 200) {
        return { success: true, token: res.data.access_token };
      }

      return { success: false, error: `API错误: ${res.statusCode}` };
    } catch (err) {
      console.error('[SupabaseAuth] 刷新 Token 失败:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : '刷新 Token 失败',
      };
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    if (!currentEnv.useMock) {
      // 生产环境：调用退出接口
      try {
        const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
        await Taro.request({
          url: `${currentEnv.supabaseUrl}/auth/v1/logout`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'apikey': currentEnv.supabaseKey,
          },
        });
      } catch (err) {
        console.error('[SupabaseAuth] 退出登录失败:', err);
      }
    }

    // 清除本地存储
    Taro.removeStorageSync(STORAGE_KEYS.TOKEN);
    Taro.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN);
    Taro.removeStorageSync(STORAGE_KEYS.USER);
  }

  /**
   * 生成 Mock Token
   */
  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
  }

  /**
   * 为用户生成 Token
   */
  private generateTokens(user: MockUser): {
    success: boolean;
    token?: string;
    refreshToken?: string;
    user?: {
      id: string;
      openid: string;
      nickname?: string;
      avatarUrl?: string;
    };
  } {
    const token = this.generateMockToken();
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;

    return {
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}

/** 导出单例实例 */
export const supabaseAuth = SupabaseAuthService.getInstance();
