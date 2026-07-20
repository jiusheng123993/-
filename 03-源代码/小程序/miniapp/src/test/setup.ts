import { vi } from 'vitest'

// 全局 mock Taro API
globalThis.Taro = {
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateBack: vi.fn(),
  navigateTo: vi.fn(),
  switchTab: vi.fn(),
  login: vi.fn(),
  getCurrentInstance: vi.fn(() => ({
    router: { params: {} }
  })),
  clearStorageSync: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn()
} as any

// Polyfill for jsdom requestAnimationFrame / cancelAnimationFrame
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || ((cb: FrameRequestCallback) => setTimeout(cb, 16))
globalThis.cancelAnimationFrame = globalThis.cancelAnimationFrame || ((id: number) => clearTimeout(id))