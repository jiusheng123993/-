/**
 * 平台适配层 - 统一导出入口
 *
 * 使用方式：
 * import { platform } from '@/platform'
 * platform.storage.getToken()
 * platform.api.get('/users')
 * platform.media.chooseImage({ count: 1 })
 */

export { getPlatform, isWeapp, isH5, isAndroid, isHarmony, isApp } from './detector'
export { storage } from './storage'
export { api, API_BASE_URL } from './api'
export { chooseImage, uploadFile, previewImage } from './media'
export { getLoginCode, sendSmsCode, loginWithPhone } from './auth'
export { requestWechatPayment, requestAlipayPayment, requestPayment } from './payment'
export { showModal, showToast, makePhoneCall, navigateTo, redirectTo, switchTab, openSetting, getSetting } from './ui'

export type { PlatformType } from './detector'
export type { ChooseImageResult, UploadFileResult } from './media'
export type { PaymentParams, AlipayPaymentParams } from './payment'