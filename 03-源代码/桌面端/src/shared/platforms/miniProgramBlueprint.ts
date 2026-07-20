/**
 * @deprecated 小程序已砍掉，此文件保留仅作历史参考。
 * 移动端方案改为 Capacitor Android 原生壳。
 * 请使用 platforms 模块的其他组件（AdaptiveSidebar、AdaptiveModal 等）。
 */
export interface MiniProgramModule {
  id: string
  title: string
  privacyLevel: string
}

export interface MiniProgramNav {
  id: string
  label: string
}

export interface MiniProgramBlueprint {
  positioning: string
  desktopBoundary: string
  mobileBoundary: string
  recommendedThemeId: string
  navigation: MiniProgramNav[]
  syncStrategy: string
  modules: MiniProgramModule[]
  implementationRoute: {
    platform: string
    framework: string
    reason: string
  }
}

export const miniProgramBlueprint: MiniProgramBlueprint = {
  positioning: '桌面端深度规划 + 小程序轻量执行',
  desktopBoundary: '规划、分析、复盘',
  mobileBoundary: '打卡、查看、提醒',
  recommendedThemeId: 'minimal-dawn',
  navigation: [
    { id: 'home', label: '今天' },
    { id: 'modules', label: '模块' },
    { id: 'me', label: '我的' }
  ],
  syncStrategy: '桌面端为主数据源，小程序实时同步',
  modules: [
    { id: 'focus', title: '专注', privacyLevel: '仅自己可见' },
    { id: 'habits', title: '习惯', privacyLevel: '仅自己可见' },
    { id: 'schedule', title: '日程', privacyLevel: '仅自己可见' },
    { id: 'notes', title: '笔记', privacyLevel: '仅自己可见' }
  ],
  implementationRoute: {
    platform: '微信小程序',
    framework: '原生 + WXS',
    reason: '轻量级，与桌面端数据互通'
  }
}

export function getDefaultMiniProgramModules(): MiniProgramModule[] {
  return miniProgramBlueprint.modules
}
