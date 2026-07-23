export const CONFIG = {
  API_BASE_URL: process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000',
  USE_MOCK: false,
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
    USER: 'xhh_user',
    REFRESH_TOKEN: 'xhh_refresh_token',
  },
}