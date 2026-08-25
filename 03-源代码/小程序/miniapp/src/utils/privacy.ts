import Taro from '@tarojs/taro'
import { isWeapp } from '../platform/detector'

/**
 * 带隐私授权处理的 chooseImage 包装函数
 *
 * ⚠️ 底层 API 说明（2026-08-25 全量选图失效修复）：
 * wx.chooseImage 自基础库 2.21.0 起停止维护，在新基础库（如 3.16.2）上已实质
 * 失效——调用后不弹窗、不回调、仅 errorReport，表现为「点击选图无反应」且
 * 业务层任何提示逻辑都不会执行。故微信端统一切换到官方替代接口 chooseMedia
 * （mediaType 锁定 image），并把返回结构适配回 chooseImage 形状
 * （chooseMedia 的 res.tempFiles[].tempFilePath → chooseImage 的
 * res.tempFilePaths / res.tempFiles[].path），所有调用方零改动。
 *
 * 隐私授权方案（微信官方二选一，本项目走「被动监听」）：
 * - 被动监听（已采用）：app.js 在启动时注册 wx.onNeedPrivacyAuthorization，
 *   隐私接口被调用且用户未授权时，微信自动触发回调 → 全局 PrivacyPopup
 *   （openType="agreePrivacyAuthorization" 按钮）→ 用户同意后微信自动放行
 *   并继续执行被拦截的隐私接口（chooseMedia 同样受此机制保护）。
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
    if (isWeapp()) {
      // 微信端走 chooseMedia（chooseImage 已废弃）；用户未授权时微信会自动触发
      // app.js 注册的 onNeedPrivacyAuthorization，同意后自动继续执行本次调用
      const res = await Taro.chooseMedia({
        count: options.count ?? 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: options.sizeType as Taro.chooseMedia.Option['sizeType'],
      })
      // 适配回 chooseImage 的返回形状，调用方按原契约消费
      return {
        errMsg: 'chooseImage:ok',
        tempFilePaths: res.tempFiles.map((f) => f.tempFilePath),
        tempFiles: res.tempFiles.map((f) => ({ path: f.tempFilePath, size: f.size })) as Taro.chooseImage.SuccessCallbackResult['tempFiles'],
      }
    }
    // 非微信端保留原接口（Taro H5 层自行实现）
    return await Taro.chooseImage(options)
  } catch (err: any) {
    // 用户主动取消（关闭选择面板/ActionSheet 点取消）：正常交互，不提示
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
