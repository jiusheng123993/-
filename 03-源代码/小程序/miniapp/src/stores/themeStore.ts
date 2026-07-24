import create from 'zustand';
import Taro from '@tarojs/taro';

export type ThemeKey =
  | 'sakura-dream-light' | 'forest-dew-light' | 'twilight-coast-light' | 'honey-glow-light'
  | 'sakura-dream' | 'forest-dew' | 'twilight-coast' | 'honey-glow';

export type ThemeMode = 'light' | 'dark';

export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  emoji: string;
  desc: string;
  primaryColor: string;
  mode: ThemeMode;
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
  // —— 日间模式（亮色系）——
  {
    key: 'sakura-dream-light',
    name: '樱语花境',
    emoji: '🌸',
    desc: '亮粉色系，温柔明亮如樱花雨',
    primaryColor: '#D08AA8',
    mode: 'light',
    navbarBg: '#FFF0F5',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#A89898',
    tabBarSelectedColor: '#D08AA8',
    tabBarBorderStyle: 'white',
  },
  {
    key: 'forest-dew-light',
    name: '森林晨露',
    emoji: '🌿',
    desc: '亮绿色系，清新自然如晨间森林',
    primaryColor: '#6AAA88',
    mode: 'light',
    navbarBg: '#F0F8F4',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#90A098',
    tabBarSelectedColor: '#6AAA88',
    tabBarBorderStyle: 'white',
  },
  {
    key: 'twilight-coast-light',
    name: '暮色海岸',
    emoji: '🌊',
    desc: '亮蓝色系，清新通透如海天一色',
    primaryColor: '#6A98B8',
    mode: 'light',
    navbarBg: '#F0F5FA',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#909CA8',
    tabBarSelectedColor: '#6A98B8',
    tabBarBorderStyle: 'white',
  },
  {
    key: 'honey-glow-light',
    name: '暖阳蜜语',
    emoji: '🍯',
    desc: '亮橙色系，温暖明亮如午后阳光',
    primaryColor: '#C89868',
    mode: 'light',
    navbarBg: '#FFF8F0',
    navbarFrontColor: '#000000',
    tabBarBg: '#FFFFFF',
    tabBarColor: '#A89878',
    tabBarSelectedColor: '#C89868',
    tabBarBorderStyle: 'white',
  },
  // —— 夜间模式（暗色系）——
  {
    key: 'sakura-dream',
    name: '樱语花境',
    emoji: '🌸',
    desc: '暗粉色系，柔雾玫瑰如夜樱低语',
    primaryColor: '#C88EA8',
    mode: 'dark',
    navbarBg: '#1A1418',
    navbarFrontColor: '#ffffff',
    tabBarBg: '#1A1418',
    tabBarColor: '#786870',
    tabBarSelectedColor: '#C88EA8',
    tabBarBorderStyle: 'black',
  },
  {
    key: 'forest-dew',
    name: '森林晨露',
    emoji: '🌿',
    desc: '暗绿色系，雾霭鼠尾草如夜林漫步',
    primaryColor: '#8EA898',
    mode: 'dark',
    navbarBg: '#141A16',
    navbarFrontColor: '#ffffff',
    tabBarBg: '#141A16',
    tabBarColor: '#687868',
    tabBarSelectedColor: '#8EA898',
    tabBarBorderStyle: 'black',
  },
  {
    key: 'twilight-coast',
    name: '暮色海岸',
    emoji: '🌊',
    desc: '暗蓝色系，雾蓝海天色静谧深邃',
    primaryColor: '#8EA8B8',
    mode: 'dark',
    navbarBg: '#14181A',
    navbarFrontColor: '#ffffff',
    tabBarBg: '#14181A',
    tabBarColor: '#687078',
    tabBarSelectedColor: '#8EA8B8',
    tabBarBorderStyle: 'black',
  },
  {
    key: 'honey-glow',
    name: '暖阳蜜语',
    emoji: '🍯',
    desc: '暗橙色系，蜂蜜琥珀色温暖醇厚',
    primaryColor: '#C8A078',
    mode: 'dark',
    navbarBg: '#1A1610',
    navbarFrontColor: '#ffffff',
    tabBarBg: '#1A1610',
    tabBarColor: '#787060',
    tabBarSelectedColor: '#C8A078',
    tabBarBorderStyle: 'black',
  },
];

const THEME_STORAGE_KEY = 'xhh_theme';
const DEFAULT_THEME: ThemeKey = 'sakura-dream-light';

interface ThemeState {
  current: ThemeKey;
  loadTheme: () => void;
  setTheme: (theme: ThemeKey) => void;
  applyNativeBars: (theme: ThemeKey) => void;
}

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

  loadTheme: () => {
    const theme = getStoredTheme();
    set({ current: theme });
    applyNativeBars(theme);
  },

  setTheme: (theme: ThemeKey) => {
    try {
      Taro.setStorageSync(THEME_STORAGE_KEY, theme);
    } catch {}
    set({ current: theme });
    applyNativeBars(theme);
    // 通过事件中心通知各页面组件重渲染（Taro 小程序中 Zustand v3 selector 不可靠）
    Taro.eventCenter.trigger('themeChange', theme);
  },

  applyNativeBars,
}));
