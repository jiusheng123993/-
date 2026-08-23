import Taro from '@tarojs/taro'

/**
 * 带隐私授权处理的 chooseImage 包装函数
 *
 * 隐私授权方案（微信官方二选一，本项目走「被动监听」）：
 * - 被动监听（已采用）：app.js 在启动时注册 wx.onNeedPrivacyAuthorization，
 *   隐私接口被调用且用户未授权时，微信自动触发回调 → 全局 PrivacyPopup
 *   （openType="agreePrivacyAuthorization" 按钮）→ 用户同意后微信自动放行
 *   并继续执行被拦截的隐私接口（如 chooseImage）。
 * - 主动触发（已废弃）：wx.requirePrivacyAuthorize。与被动监听【混用】会导致
 *   授权流程互相干扰：手动 requirePrivacyAuthorize 在用户未授权时直接失败，
 *   而失败错误对象（errno/errMsg）形态随基础库/工具版本变化，旧代码只识别
 *   errno 112 与含 "privacy" 的 errMsg，其余失败被静默吞掉 → 表现就是
 *   「点击选择照片无反应」。故这里不再手动调用 requirePrivacyAuthorize。
 *
 * 失败反馈约定：除用户主动取消外，一律给出 toast/modal 提示，避免静默无反应。
 */
export async function chooseImageWithPrivacy(
  options: Taro.chooseImage.Option
): Promise<Taro.chooseImage.SuccessCallbackResult> {
  try {
    // 微信在用户未授权时会自动触发 app.js 注册的 onNeedPrivacyAuthorization，
    // 同意后自动继续执行本次 chooseImage；已授权用户直接打开相册。
    return await Taro.chooseImage(options)
  } catch (err: any) {
    // 用户主动取消（如关闭相册选择器）：正常交互，不提示
    if (typeof err?.errMsg === 'string' && err.errMsg.includes('cancel')) {
      throw err
    }
    // errno 112：隐私接口未在微信公众平台「设置 > 隐私保护设置」中声明
    // （或隐私协议未配置）。属后台配置问题，前端只能提示开发者处理。
    if (err?.errno === 112) {
      Taro.showModal({
        title: '功能不可用',
        content: '图片选择功能尚未完成隐私配置。\n\n请开发者前往微信小程序管理后台，在「设置 > 隐私保护设置」中声明「选择图片或拍照」接口的使用目的。',
        showCancel: false,
        confirmText: '我知道了',
      })
      throw err
    }
    // 用户拒绝隐私授权：微信 fail 消息含 "privacy"
    if (typeof err?.errMsg === 'string' && err.errMsg.includes('privacy')) {
      Taro.showToast({ title: '需要同意《用户隐私保护指引》才能使用此功能', icon: 'none', duration: 2500 })
      throw err
    }
    // 其他失败（相册/相机权限被禁、系统异常等）：统一提示，避免「点击无反应」
    Taro.showToast({ title: '选择照片失败，请重试', icon: 'none' })
    throw err
  }
}
