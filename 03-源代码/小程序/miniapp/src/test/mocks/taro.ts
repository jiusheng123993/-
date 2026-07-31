/**
 * Taro API Mock
 * 模拟 Taro 框架的常用 API，用于组件单元测试
 */
import { vi } from 'vitest'

const Taro = {
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateBack: vi.fn(),
  navigateTo: vi.fn(),
  switchTab: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  login: vi.fn(),
  getCurrentInstance: vi.fn(() => ({
    router: { params: {} }
  })),
  clearStorageSync: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    windowWidth: 375,
    windowHeight: 667
  })),
  request: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  createInnerAudioContext: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    onEnded: vi.fn(),
    onError: vi.fn()
  })),
  onAppShow: vi.fn(),
  onAppHide: vi.fn(),
  offAppShow: vi.fn(),
  offAppHide: vi.fn(),
  eventCenter: {
    on: vi.fn(),
    off: vi.fn(),
    trigger: vi.fn()
  }
}

export default Taro