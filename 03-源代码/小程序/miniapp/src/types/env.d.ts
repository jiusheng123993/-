/** 环境变量类型声明 */
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

// 兼容 src/app.js 等无类型入口文件的 side-effect 导入
declare module '*.js' {
  const content: unknown
  export default content
}

declare const process: {
  env: {
    TARO_APP_API_BASE_URL: string
    TARO_APP_ASSETS_BASE_URL?: string
    TARO_APP_USE_MOCK?: string
    TARO_APP_SUPABASE_URL: string
    TARO_APP_SUPABASE_KEY: string
    TARO_APP_JWT_SECRET: string
    TARO_APP_FOLLOWUP_TEMPLATE_ID?: string
    TARO_APP_CARE_PLAN_TEMPLATE_ID?: string
    TARO_APP_HEALTH_CHECKIN_TEMPLATE_ID?: string
    TARO_APP_VACCINE_REMINDER_TEMPLATE_ID?: string
    TARO_APP_AI_BASE_URL?: string
    TARO_APP_AI_API_KEY?: string
    TARO_APP_AI_MODEL?: string
    TARO_APP_GUARD_MODEL?: string
    TARO_APP_CRYPTO_SALT?: string
    NODE_ENV: 'development' | 'production' | 'test'
  }
}

/**
 * 自定义原生组件类型声明（Taro JSX）
 * wechat-profile 是微信原生组件（chooseAvatar + nickname 能力），
 * Taro 3.6 编译层不支持这两个属性，故用原生组件 + usingComponents 引入。
 * 事件名用小驼峰对应原生 bind:chooseavatar / bind:input。
 */
declare namespace JSX {
  interface IntrinsicElements {
    'wechat-profile': {
      nickname?: string
      avatar?: string
      onChooseavatar?: (e: any) => void
      onNickchange?: (e: any) => void
    }
  }
}
