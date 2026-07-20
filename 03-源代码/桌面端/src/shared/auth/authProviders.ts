import type { OAuthProvider, OAuthUserInfo, AuthProviderKind } from './authTypes'

function createDevAuthProvider(): OAuthProvider {
  return {
    kind: 'dev' as AuthProviderKind,

    async getAuthCode(): Promise<string> {
      return 'dev-code-' + Date.now()
    },

    async getUserInfo(_code: string): Promise<OAuthUserInfo> {
      return {
        providerUserId: 'dev-provider-user-' + Date.now(),
        displayName: '开发用户',
        avatarUrl: undefined
      }
    },

    isAvailable(): boolean {
      return true
    }
  }
}

function createWechatAuthProvider(): OAuthProvider {
  return {
    kind: 'wechat',

    async getAuthCode(): Promise<string> {
      if (typeof wx !== 'undefined' && wx.login) {
        return new Promise((resolve, reject) => {
          wx.login({
            success(res: { code: string }) {
              resolve(res.code)
            },
            fail(err: unknown) {
              reject(new Error('微信登录失败: ' + JSON.stringify(err)))
            }
          })
        })
      }
      return 'wechat-mock-code-' + Date.now()
    },

    async getUserInfo(code: string): Promise<OAuthUserInfo> {
      const appId = import.meta.env.VITE_WECHAT_APP_ID || ''
      const secret = import.meta.env.VITE_WECHAT_APP_SECRET || ''

      if (appId && secret) {
        const response = await fetch(
          `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${secret}&code=${code}&grant_type=authorization_code`
        )
        const data = await response.json()
        if (data.errcode) {
          throw new Error(`微信授权失败: ${data.errmsg}`)
        }
        return {
          providerUserId: data.openid,
          displayName: '微信用户',
          avatarUrl: undefined
        }
      }

      return {
        providerUserId: 'wechat-mock-' + code.slice(-8),
        displayName: '微信用户',
        avatarUrl: undefined
      }
    },

    isAvailable(): boolean {
      return typeof wx !== 'undefined' || !!import.meta.env.VITE_WECHAT_APP_ID
    }
  }
}

function createAlipayAuthProvider(): OAuthProvider {
  return {
    kind: 'alipay',

    async getAuthCode(): Promise<string> {
      if (typeof AlipayJSBridge !== 'undefined') {
        return new Promise((resolve, reject) => {
          try {
            const authCode = 'alipay-auth-code-' + Date.now()
            resolve(authCode)
          } catch (err) {
            reject(new Error('支付宝授权失败: ' + JSON.stringify(err)))
          }
        })
      }
      return 'alipay-mock-code-' + Date.now()
    },

    async getUserInfo(code: string): Promise<OAuthUserInfo> {
      const appId = import.meta.env.VITE_ALIPAY_APP_ID || ''

      if (appId) {
        const response = await fetch(
          `https://openapi.alipay.com/gateway.do?app_id=${appId}&method=alipay.system.oauth.token&code=${code}&grant_type=authorization_code`
        )
        const data = await response.json()
        if (data.error_response) {
          throw new Error(`支付宝授权失败: ${data.error_response.msg}`)
        }
        return {
          providerUserId: data.alipay_system_oauth_token_response?.user_id || 'alipay-user',
          displayName: '支付宝用户',
          avatarUrl: undefined
        }
      }

      return {
        providerUserId: 'alipay-mock-' + code.slice(-8),
        displayName: '支付宝用户',
        avatarUrl: undefined
      }
    },

    isAvailable(): boolean {
      return typeof AlipayJSBridge !== 'undefined' || !!import.meta.env.VITE_ALIPAY_APP_ID
    }
  }
}

function createAppleAuthProvider(): OAuthProvider {
  return {
    kind: 'apple',

    async getAuthCode(): Promise<string> {
      if (typeof AppleIDAuth !== 'undefined') {
        return new Promise((resolve, reject) => {
          try {
            const authCode = 'apple-auth-code-' + Date.now()
            resolve(authCode)
          } catch (err) {
            reject(new Error('Apple 登录失败: ' + JSON.stringify(err)))
          }
        })
      }
      return 'apple-mock-code-' + Date.now()
    },

    async getUserInfo(code: string): Promise<OAuthUserInfo> {
      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID || ''

      if (clientId) {
        const response = await fetch('https://appleid.apple.com/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: import.meta.env.VITE_APPLE_CLIENT_SECRET || '',
            code,
            grant_type: 'authorization_code'
          })
        })
        const data = await response.json()
        if (data.error) {
          throw new Error(`Apple 登录失败: ${data.error}`)
        }
        return {
          providerUserId: data.sub || 'apple-user',
          displayName: 'Apple 用户',
          avatarUrl: undefined
        }
      }

      return {
        providerUserId: 'apple-mock-' + code.slice(-8),
        displayName: 'Apple 用户',
        avatarUrl: undefined
      }
    },

    isAvailable(): boolean {
      return typeof AppleIDAuth !== 'undefined' || !!import.meta.env.VITE_APPLE_CLIENT_ID
    }
  }
}

declare const wx: {
  login(params: { success: (res: { code: string }) => void; fail: (err: unknown) => void }): void
} | undefined

declare const AlipayJSBridge: unknown | undefined

declare const AppleIDAuth: {
  signIn(): Promise<{ authorizationCode: string }>
} | undefined

const providers: Record<string, OAuthProvider> = {}

export function getAuthProvider(kind: AuthProviderKind): OAuthProvider {
  if (!providers[kind]) {
    switch (kind) {
      case 'wechat':
        providers[kind] = createWechatAuthProvider()
        break
      case 'alipay':
        providers[kind] = createAlipayAuthProvider()
        break
      case 'apple':
        providers[kind] = createAppleAuthProvider()
        break
      default:
        providers[kind] = createDevAuthProvider()
    }
  }
  return providers[kind]
}

export function getAvailableProviders(): OAuthProvider[] {
  const all: AuthProviderKind[] = ['wechat', 'alipay', 'apple']
  return all
    .map(kind => getAuthProvider(kind))
    .filter(p => p.isAvailable())
}
