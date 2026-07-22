import Taro from '@tarojs/taro';

interface EnvConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  useMock: boolean;
}

export const ENV: Record<string, EnvConfig> = {
  development: {
    apiBaseUrl: process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000',
    supabaseUrl: (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_URL || 'http://localhost:54321',
    supabaseKey: (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_KEY || 'mock-key',
    useMock: !process.env.TARO_APP_API_BASE_URL,
  },
  production: {
    apiBaseUrl: process.env.TARO_APP_API_BASE_URL || '',
    supabaseUrl: (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_URL || '',
    supabaseKey: (process.env as Record<string, string | undefined>).TARO_APP_SUPABASE_KEY || '',
    useMock: false,
  },
};

function resolveCurrentEnv(): EnvConfig {
  const envName = process.env.NODE_ENV || 'development';
  const envConfig = ENV[envName] || ENV.development;

  if (envName === 'production' && envConfig.useMock) {
    throw new Error('[Security] Mock mode is forbidden in production environment');
  }

  if (envName === 'production' && !envConfig.apiBaseUrl) {
    throw new Error('[Security] Production API base URL is not configured');
  }

  if (envName === 'production' && !envConfig.supabaseUrl) {
    throw new Error('[Security] Production Supabase URL is not configured');
  }

  if (envName === 'production' && !envConfig.supabaseKey) {
    throw new Error('[Security] Production Supabase key is not configured');
  }

  const hasFullConfig = envConfig.apiBaseUrl && envConfig.supabaseUrl && envConfig.supabaseKey;
  if (envName === 'development' && !hasFullConfig && !envConfig.useMock) {
    return { ...envConfig, useMock: true };
  }

  return envConfig;
}

const currentEnv = resolveCurrentEnv();

export function getEdgeFunctionUrl(functionName: string): string {
  const base = currentEnv.supabaseUrl || currentEnv.apiBaseUrl
  return `${base}/functions/v1/${functionName}`
}

export const TOKEN_EXPIRY = 7 * 24 * 60 * 60;

export const STORAGE_KEYS = {
  TOKEN: 'xhh_token',
  USER: 'xhh_user',
  REFRESH_TOKEN: 'xhh_refresh_token',
} as const;

interface MockUser {
  id: string;
  openid: string;
  nickname?: string;
  avatarUrl?: string;
  createdAt: number;
}

const mockUsers: Record<string, MockUser> = {};

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface BackendLoginResponse {
  userId: string;
  role: string;
  displayName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface BackendRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class SupabaseAuthService {
  private static instance: SupabaseAuthService;

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

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
    needRegister?: boolean;
  }> {
    try {
      if (currentEnv.useMock) {
        const existingUser = Object.values(mockUsers).find(u => u.openid === code);

        if (existingUser) {
          return this.generateTokens(existingUser);
        }

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

      const res = await Taro.request({
        url: `${currentEnv.apiBaseUrl}/api/auth/login`,
        method: 'POST',
        data: {
          provider: 'wechat',
          code,
        },
        header: {
          'Content-Type': 'application/json',
        },
      });

      if (res.statusCode === 200) {
        const data = res.data as BackendLoginResponse;
        return {
          success: true,
          token: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id: data.userId,
            openid: code,
            nickname: data.displayName,
            avatarUrl: data.avatarUrl,
          },
        };
      }

      if (res.statusCode === 404) {
        const data = res.data as { needRegister?: boolean; message?: string };
        if (data.needRegister) {
          return {
            success: false,
            error: '用户未注册',
            needRegister: true,
          };
        }
      }

      return { success: false, error: `请求失败: ${res.statusCode}` };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '登录失败',
      };
    }
  }

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

      const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
      const res = await Taro.request({
        url: `${currentEnv.apiBaseUrl}/api/auth/session`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.statusCode === 200) {
        const data = res.data as BackendLoginResponse;
        return {
          success: true,
          user: {
            id: data.userId,
            openid: '',
            nickname: data.displayName,
            avatarUrl: data.avatarUrl,
          },
        };
      }

      return { success: false, error: `请求失败: ${res.statusCode}` };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '获取用户信息失败',
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      if (currentEnv.useMock) {
        const token = this.generateMockToken();
        return { success: true, token };
      }

      const res = await Taro.request({
        url: `${currentEnv.apiBaseUrl}/api/auth/refresh`,
        method: 'POST',
        data: {
          refreshToken,
        },
        header: {
          'Content-Type': 'application/json',
        },
      });

      if (res.statusCode === 200) {
        const data = res.data as BackendRefreshResponse;
        return { success: true, token: data.accessToken };
      }

      return { success: false, error: `请求失败: ${res.statusCode}` };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '刷新 Token 失败',
      };
    }
  }

  async logout(): Promise<void> {
    if (!currentEnv.useMock) {
      try {
        const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN);
        await Taro.request({
          url: `${currentEnv.apiBaseUrl}/api/auth/logout`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {
        // ignore
      }
    }

    Taro.removeStorageSync(STORAGE_KEYS.TOKEN);
    Taro.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN);
    Taro.removeStorageSync(STORAGE_KEYS.USER);
  }

  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
  }

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

export const supabaseAuth = SupabaseAuthService.getInstance();
