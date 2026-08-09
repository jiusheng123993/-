/**
 * 应用配置
 * 管理 API 地址、Mock 模式开关、存储 Key 等运行时配置
 */
export const CONFIG = {
  // 正式 API 域名（微信小程序要求 HTTPS；WebSocket 会自动推导为 wss）
  // 注意：证书是 *.xinghuanhai.com 通配符，裸域名不覆盖，必须用 api.xinghuanhai.com
  API_BASE_URL: process.env.TARO_APP_API_BASE_URL || 'https://api.xinghuanhai.com',
  /**
   * 静态资源地址（BGM 预览等）。
   * 目前复用 api 域名（服务器 /var/www/xinghuanhai 静态目录）；
   * 以后 assets.xinghuanhai.com 解析好后，用环境变量 TARO_APP_ASSETS_BASE_URL 切换即可。
   */
  ASSETS_BASE_URL: process.env.TARO_APP_ASSETS_BASE_URL || 'https://api.xinghuanhai.com',
  USE_MOCK: process.env.TARO_APP_USE_MOCK === 'true',
  STORAGE_KEYS: {
    TOKEN: 'xhh_token',
    USER: 'xhh_user',
    REFRESH_TOKEN: 'xhh_refresh_token',
  },
}
