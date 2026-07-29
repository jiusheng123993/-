import Taro from '@tarojs/taro'

/**
 * 带隐私授权检查的 chooseImage 包装函数
 * 在调用 Taro.chooseImage 前先请求隐私授权
 *
 * 注意：errno 112 表示 API scope 未在微信小程序管理后台「设置 > 隐私保护设置」中声明
 * 开发者需要在管理后台声明以下隐私接口：
 * - 选择图片或拍照（chooseImage）
 * - 保存图片到相册（saveImageToPhotosAlbum）
 * 并填写对应的使用目的说明
 */
export async function chooseImageWithPrivacy(
  options: Taro.chooseImage.Option
): Promise<Taro.chooseImage.SuccessCallbackResult> {
  try {
    // 微信基础库 2.32.3+ 必须先完成隐私授权才能调用隐私接口
    if (typeof (Taro as any).requirePrivacyAuthorize === 'function') {
      await (Taro as any).requirePrivacyAuthorize()
    }
  } catch (err: any) {
    // errno 112 = api scope 未在隐私协议中声明
    if (err?.errno === 112) {
      Taro.showModal({
        title: '功能不可用',
        content: '图片选择功能尚未完成隐私配置。\n\n请开发者前往微信小程序管理后台，在「设置 > 隐私保护设置」中声明「选择图片或拍照」接口的使用目的。',
        showCancel: false,
        confirmText: '我知道了',
      })
      throw err
    }
    // 用户拒绝隐私授权
    if (err?.errMsg?.includes('privacy')) {
      Taro.showToast({ title: '需要授权相机和相册权限才能使用此功能', icon: 'none', duration: 2500 })
      throw err
    }
    // 其他错误
    throw err
  }
  return Taro.chooseImage(options)
}