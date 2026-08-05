/**
 * 主题状态管理
 * 管理主题切换、持久化和原生导航栏/标签栏颜色适配
 * 四季主题：秋·暖阳珊瑚橙 / 春·嫩芽绿 / 夏·海盐蓝 / 冬·冰晶紫
 */
import create from 'zustand';
import Taro from '@tarojs/taro';

export type ThemeKey = 'spring' | 'summer' | 'autumn' | 'winter';

export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  emoji: string;
  desc: string;
  primaryColor: string;
  // 导航栏（原生组件，需 Taro.setNavigationBarColor 动态设置）
  navbarBg: string;
  navbarFrontColor: '#ffffff' | '#000000';
  // 标签栏（原生组件，需 Taro.setTabBarStyle 动态设置）
  tabBarBg: string;
  tabBarColor: string;
  tabBarSelectedColor: string;
  tabBarBorderStyle: 'black' | 'white';
}

export const THEME_LIST: ThemeMeta[] = [
  {
    key: 'autumn',
    name: '暖阳珊瑚橙',
    emoji: '🍊',
    desc: '高饱和珊瑚橙 · 暖金 · 奶油暖白',
    primaryColor: '#FF6B3D',
    navbarBg: '#FFF6EE',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#B69B83',
    tabBarSelectedColor: '#FF6B3D',
    tabBarBorderStyle: 'white',
  },
  {
    key: 'spring',
    name: '嫩芽绿',
    emoji: '🌱',
    desc: '清新嫩芽绿 · 迎春花黄 · 奶油嫩白',
    primaryColor: '#54B460',
    navbarBg: '#F3FAEF',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#9BB494',
    tabBarSelectedColor: '#54B460',
    tabBarBorderStyle: 'white',
  },
  {
    key: 'summer',
    name: '海盐蓝',
    emoji: '🌊',
    desc: '海盐天蓝 · 落日橙 · 清爽蓝白',
    primaryColor: '#2FA8E8',
    navbarBg: '#EFF7FC',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#8FA6B8',
    tabBarSelectedColor: '#2FA8E8',
    tabBarBorderStyle: 'white',
  },
  {
    key: 'winter',
    name: '冰晶紫',
    emoji: '❄️',
    desc: '冰晶紫 · 雪青蓝 · 霜白',
    primaryColor: '#6C7CF0',
    navbarBg: '#F1F3FB',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#929CBA',
    tabBarSelectedColor: '#6C7CF0',
    tabBarBorderStyle: 'white',
  },
];

const THEME_STORAGE_KEY = 'xhh_theme';
const DEFAULT_THEME: ThemeKey = 'autumn';

/** 主题状态定义 */
interface ThemeState {
  current: ThemeKey;
  loadTheme: () => void;
  setTheme: (theme: ThemeKey) => void;
  applyNativeBars: (theme: ThemeKey) => void;
}

/** 从本地存储获取已保存的主题 */
function getStoredTheme(): ThemeKey {
  try {
    const raw = Taro.getStorageSync(THEME_STORAGE_KEY);
    if (raw && THEME_LIST.some(t => t.key === raw)) return raw as ThemeKey;
  } catch {}
  return DEFAULT_THEME;
}

/** 根据主题 key 查找元数据 */
function getMeta(theme: ThemeKey): ThemeMeta {
  return THEME_LIST.find(t => t.key === theme) ?? THEME_LIST[0];
}

/** 动态更新微信原生导航栏和标签栏颜色 */
function applyNativeBars(theme: ThemeKey) {
  const meta = getMeta(theme);
  Taro.setNavigationBarColor({
    frontColor: meta.navbarFrontColor,
    backgroundColor: meta.navbarBg,
    animation: { duration: 300, timingFunc: 'easeInOut' },
  }).catch(() => {});
  Taro.setTabBarStyle({
    color: meta.tabBarColor,
    selectedColor: meta.tabBarSelectedColor,
    backgroundColor: meta.tabBarBg,
    borderStyle: meta.tabBarBorderStyle,
  }).catch(() => {});
}

export const useThemeStore = create<ThemeState>((set) => ({
  current: getStoredTheme(),

  /** 从本地存储加载主题并应用到原生组件 */
  loadTheme: () => {
    const theme = getStoredTheme();
    set({ current: theme });
    applyNativeBars(theme);
  },

  /**
   * 切换主题并持久化
   * @param theme - 主题 key
   */
  setTheme: (theme: ThemeKey) => {
    try {
      Taro.setStorageSync(THEME_STORAGE_KEY, theme);
    } catch {}
    set({ current: theme });
    applyNativeBars(theme);
    // 通过事件中心通知各页面组件重渲染
    Taro.eventCenter.trigger('themeChange', theme);
  },

  applyNativeBars,
}));