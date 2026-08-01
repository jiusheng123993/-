/**
 * 平台适配器 - UI 交互模块
 * 弹出框、提示、拨号、设置等
 */
import Taro from '@tarojs/taro'
import { isWeapp } from './detector'

/**
 * 弹出确认对话框
 */
export async function showModal(params: {
  title: string
  content: string
  confirmText?: string
  cancelText?: string
}): Promise<{ confirm: boolean; cancel: boolean }> {
  if (isWeapp()) {
    return new Promise((resolve) => {
      Taro.showModal({
        title: params.title,
        content: params.content,
        confirmText: params.confirmText || '确定',
        cancelText: params.cancelText || '取消',
        success: (res: any) => resolve(res),
        fail: () => resolve({ confirm: false, cancel: true }),
      })
    })
  }

  const confirmed = window.confirm(params.content)
  return { confirm: confirmed, cancel: !confirmed }
}

/**
 * 弹出提示
 */
export async function showToast(params: {
  title: string
  icon?: 'success' | 'error' | 'loading' | 'none'
  duration?: number
}): Promise<void> {
  if (isWeapp()) {
    Taro.showToast({
      title: params.title,
      icon: params.icon || 'none',
      duration: params.duration || 1500,
    })
    return
  }

  alert(params.title)
}

/**
 * 拨打电话
 */
export async function makePhoneCall(phoneNumber: string): Promise<void> {
  if (isWeapp()) {
    Taro.makePhoneCall({ phoneNumber })
    return
  }

  window.location.href = `tel:${phoneNumber}`
}

/**
 * 页面跳转
 */
export function navigateTo(url: string): void {
  if (isWeapp()) {
    Taro.navigateTo({ url })
    return
  }

  window.location.hash = url.replace(/^\//, '')
}

export function redirectTo(url: string): void {
  if (isWeapp()) {
    Taro.redirectTo({ url })
    return
  }

  window.location.hash = url.replace(/^\//, '')
}

export function switchTab(url: string): void {
  if (isWeapp()) {
    Taro.switchTab({ url })
    return
  }

  window.location.hash = url.replace(/^\//, '')
}

/**
 * 打开设置页面
 */
export async function openSetting(): Promise<any> {
  if (isWeapp()) {
    return new Promise((resolve) => {
      Taro.openSetting({
        success: (res: any) => resolve(res.authSetting || {}),
        fail: () => resolve({}),
      })
    })
  }

  return {}
}

/**
 * 获取设置
 */
export async function getSetting(): Promise<any> {
  if (isWeapp()) {
    return new Promise((resolve) => {
      Taro.getSetting({
        success: (res: any) => resolve(res.authSetting || {}),
        fail: () => resolve({}),
      })
    })
  }

  return {}
}