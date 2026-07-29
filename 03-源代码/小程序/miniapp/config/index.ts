import { defineConfig } from '@tarojs/cli'
import path from 'path'

const config = {
  projectName: 'xinghuanhai-miniapp',
  date: '2024-07-22',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    path.join(__dirname, 'plugin-ensure-wxss.ts'),
  ],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
    webpackChain(chain) {
      chain.merge({
        ignoreWarnings: [/Conflicting order/],
      })
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  alias: {
    '@': 'src',
  },
  env: {
    TARO_APP_API_BASE_URL: JSON.stringify(process.env.TARO_APP_API_BASE_URL || 'http://49.232.203.85'),
    TARO_APP_USE_MOCK: JSON.stringify(process.env.TARO_APP_USE_MOCK || 'false'),
    TARO_APP_SUPABASE_URL: JSON.stringify(process.env.TARO_APP_SUPABASE_URL || ''),
    TARO_APP_SUPABASE_KEY: JSON.stringify(process.env.TARO_APP_SUPABASE_KEY || ''),
    TARO_APP_CRYPTO_SALT: JSON.stringify(process.env.TARO_APP_CRYPTO_SALT || ''),
    TARO_APP_FOLLOWUP_TEMPLATE_ID: JSON.stringify(process.env.TARO_APP_FOLLOWUP_TEMPLATE_ID || ''),
    TARO_APP_CARE_PLAN_TEMPLATE_ID: JSON.stringify(process.env.TARO_APP_CARE_PLAN_TEMPLATE_ID || ''),
    TARO_APP_HEALTH_CHECKIN_TEMPLATE_ID: JSON.stringify(process.env.TARO_APP_HEALTH_CHECKIN_TEMPLATE_ID || ''),
    TARO_APP_VACCINE_REMINDER_TEMPLATE_ID: JSON.stringify(process.env.TARO_APP_VACCINE_REMINDER_TEMPLATE_ID || ''),
  },
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, {
      mini: {
        sourceMapType: 'cheap-module-source-map',
      },
    })
  }
  return merge({}, config, {
    mini: {
      optimizeMainPackage: {
        enable: false,
      },
    },
  })
}