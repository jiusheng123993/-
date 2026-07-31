/**
 * 主题管理 Hook
 * 提供当前主题 key 的响应式获取与 CSS 类名转换，自动应用原生导航栏样式
 */
import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { useThemeStore, type ThemeKey } from '../stores/themeStore'

/**
 * 返回当前主题 key（如 "sakura-dream"）
 * 不依赖 Zustand 订阅（Taro 3 + Zustand v3 中 selector 不可靠触发重渲染）
 * 改用 local state + Taro.eventCenter 监听变更
 *
 * 每个页面挂载/显示时自动调用 applyNativeBars 确保导航栏和标签栏颜色正确
 */
export function useThemeKey(): ThemeKey {
  const [theme, setTheme] = useState<ThemeKey>(() => useThemeStore.getState().current)

  // 页面挂载时应用原生导航栏
  useEffect(() => {
    useThemeStore.getState().applyNativeBars(useThemeStore.getState().current)
  }, [])

  // 页面每次显示时重新应用（从其他页面返回时导航栏可能被重置）
  useDidShow(() => {
    useThemeStore.getState().applyNativeBars(useThemeStore.getState().current)
  })

  useEffect(() => {
    // 同步一次 store 最新值
    setTheme(useThemeStore.getState().current)
    const handler = (t: ThemeKey) => {
      setTheme(t)
    }
    Taro.eventCenter.on('themeChange', handler)
    return () => {
      Taro.eventCenter.off('themeChange', handler)
    }
  }, [])

  return theme
}

/**
 * 返回当前主题对应的 CSS 类名（如 "theme-sakura-dream"）
 */
export function useThemeClass(): string {
  const theme = useThemeKey()
  return `theme-${theme}`
}
