/**
 * 前端测试环境初始化
 * 模拟 Taro 组件和 API，使组件可在 jsdom 环境渲染
 */
import { vi } from 'vitest';
import React from 'react';

// 模拟 @tarojs/components 的基础组件为原生 DOM 元素
vi.mock('@tarojs/components', () => {
  const mapTag = (tag: string) => ({ children, className, style, onClick, src, mode, ...rest }: any) =>
    React.createElement(tag, { className, style, onClick, src, ...rest }, children);

  return {
    View: mapTag('div'),
    Text: mapTag('span'),
    Image: mapTag('img'),
    ScrollView: mapTag('div'),
    Button: mapTag('button'),
    Input: mapTag('input'),
    Swiper: mapTag('div'),
    SwiperItem: mapTag('div'),
  };
});

// 模拟 @tarojs/taro API（含 eventCenter 用于主题切换）
const eventCenter = {
  on: vi.fn(),
  off: vi.fn(),
  trigger: vi.fn(),
};

vi.mock('@tarojs/taro', () => ({
  default: {
    showToast: vi.fn(),
    showModal: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    login: vi.fn(() => ({ code: 'mock-code' })),
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    reLaunch: vi.fn(),
    switchTab: vi.fn(),
    // 录音管理器（useVoiceInput 依赖）
    getRecorderManager: vi.fn(() => ({
      onStart: vi.fn(),
      onStop: vi.fn(),
      onError: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    getStorageSync: vi.fn(() => null),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    getStorageInfoSync: vi.fn(() => ({ keys: [] })),
    chooseImage: vi.fn(),
    uploadFile: vi.fn(),
    getSystemInfoSync: vi.fn(() => ({ windowWidth: 375, windowHeight: 667 })),
    setClipboardData: vi.fn(),
    setNavigationBarColor: vi.fn(() => ({ catch: vi.fn() })),
    setTabBarStyle: vi.fn(() => ({ catch: vi.fn() })),
    eventCenter,
  },
  showToast: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  navigateBack: vi.fn(),
  reLaunch: vi.fn(),
  switchTab: vi.fn(),
  setNavigationBarColor: vi.fn(() => ({ catch: vi.fn() })),
  setTabBarStyle: vi.fn(() => ({ catch: vi.fn() })),
  useDidShow: vi.fn(),
  useShareAppMessage: vi.fn(),
  useShareTimeline: vi.fn(),
  eventCenter,
}));
