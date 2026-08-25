import Taro from '@tarojs/taro'
import { isWeapp } from '../platform/detector'

/**
 * 微信隐私授权（主动模式，官方二选一之一）
 *
 * ⚠️ 方案演进史（2026-08-24 ~ 08-25 三轮排查沉淀）：
 * 1. 最初「被动监听」：app.js 注册 wx.onNeedPrivacyAuthorization + 自绘 PrivacyPopup。
 *    实测失败——@tarojs/taro@3.6.x 封装层【未转发】onNeedPrivacyAuthorization
 *    （typeof 检查恒 false 静默跳过）；改用原生 wx 注册后，自绘弹窗仍因渲染链路
 *    问题未展示 → 用户处于 needAuthorization=true 时所有隐私接口永久挂起，
 *    表现为「点击零反馈」（errno 104 昵称组件降级同期出现）。
 * 2. 现改「主动触发」：wx.requirePrivacyAuthorize 由【基础库弹出官方标准半屏
 *    授权弹窗】，完全不依赖小程序自绘 UI，不可能不显示。用户同意后 success，
 *    之后所有隐私接口自动放行。⚠️ 官方规定主动/被动两方案必须二选一，
 *    故 app.js 已同步移除 onNeedPrivacyAuthorization 注册与自绘弹窗挂载。
 *
 * 失败反馈约定：除用户主动取消外，一律给出 toast/modal 提示，避免静默无反应。
 */

/** 微信端：确保已完成隐私授权（未授权时弹官方标准弹窗，同意后 resolve） */
function ensureWeappPrivacyAuthorized(): Promise<void> {
  // jsdom/H5 环境无全局 wx；低版本基础库无此 API 时直接放行（由后续接口自身的 errno 分支兜底）
  const w = (globalThis as { wx?: { requirePrivacyAuthorize?: (o: { success: () => void; fail: (e: unknown) => void }) => void } }).wx
  if (!w || typeof w.requirePrivacyAuthorize !== 'function') {
    return Promise.resolve()
  }
  return new Promise<void>((resolve, reject) => {
    w.requirePrivacyAuthorize!({ success: () => resolve(), fail: reject })
  })
}

/**
 * 带隐私授权处理的 chooseImage 包装函数
 *
 * 底层 API 说明：wx.chooseImage 自基础库 2.21.0 起停止维护，在新基础库上实质
 * 失效。微信端统一切换到官方替代接口 chooseMedia（mediaType 锁定 image），并把
 * 返回结构适配回 chooseImage 形状（res.tempFilePaths / tempFiles[].path），
 * 所有调用方零改动。
 */
export async function chooseImageWithPrivacy(
  options: Taro.chooseImage.Option
): Promise<Taro.chooseImage.SuccessCallbackResult> {
  try {
    if (isWeapp()) {
      // 前置：未同意《用户隐私保护指引》时弹官方标准授权弹窗（同意一次永久生效）
      await ensureWeappPrivacyAuthorized()
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
    // 用户主动取消（关闭选择面板/ActionSheet 点取消/关闭授权弹窗）：正常交互，不提示
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
    // 用户拒绝隐私授权：requirePrivacyAuthorize / chooseMedia 的 fail 消息含 "privacy"
    if (typeof err?.errMsg === 'string' && err.errMsg.includes('privacy')) {
      Taro.showToast({ title: '需要同意《用户隐私保护指引》才能使用此功能', icon: 'none', duration: 2500 })
      throw err
    }
    // 其他失败（相册/相机权限被禁、系统异常等）：统一提示，避免「点击无反应」
    Taro.showToast({ title: '选择照片失败，请重试', icon: 'none' })
    throw err
  }
}
