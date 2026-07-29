export const CONFIG = {
  API_BASE_URL: process.env.TARO_APP_API_BASE_URL || 'http://49.232.203.85',
  USE_MOCK: process.env.TARO_APP_USE_MOCK === 'true',
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
    USER: 'xhh_user',
    REFRESH_TOKEN: 'xhh_refresh_token',
  },
}