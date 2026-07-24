import Taro from '@tarojs/taro'

export function safeNavigateBack(options?: { delta?: number; fallbackUrl?: string }) {
  const { delta = 1, fallbackUrl = '/pages/index/index' } = options || {}
  const pages = Taro.getCurrentPages()
  if (pages.length > delta) {
    Taro.navigateBack({ delta }).catch(() => {
      Taro.switchTab({ url: fallbackUrl }).catch(() => {
        Taro.reLaunch({ url: fallbackUrl })
      })
    })
  } else {
    Taro.switchTab({ url: fallbackUrl }).catch(() => {
      Taro.reLaunch({ url: fallbackUrl })
    })
  }
}