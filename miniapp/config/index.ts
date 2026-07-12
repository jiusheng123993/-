import type { UserConfigExport } from '@tarojs/cli'

const config: UserConfigExport = {
  projectName: 'xinghuanhai-miniapp',
  date: '2026-7-12',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false }
  },
  cache: {
    enable: false
  },
  mini: {
    webpackChain(chain) {
      chain.plugins.delete('webpack-progress-plugin')
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false
      }
    },
    miniCssExtractPluginOption: {
      ignoreOrder: true
    },
    commonChunks: ['runtime', 'vendors', 'taro', 'common'],
    minifyWXML: true,
    minifyWXSS: true
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    output: {
      filename: 'js/[name].[hash:8].js',
      chunkFilename: 'js/[name].[chunkhash:8].js'
    },
    miniCssExtractPluginOption: {
      ignoreOrder: true,
      filename: 'css/[name].[hash].css',
      chunkFilename: 'css/[name].[chunkhash].css'
    },
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false
      }
    }
  }
}

export default function merge(env: any, argv: any) {
  if (argv && argv.mode === 'development') {
    return {
      ...config,
      devtool: 'cheap-module-source-map'
    }
  }
  return config
}
