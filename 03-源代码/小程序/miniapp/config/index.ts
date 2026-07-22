import type { UserConfigExport } from '@tarojs/cli'
import path from 'path'

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
      chain.resolve.alias.set('@', path.resolve(__dirname, '..', 'src'))
      chain.resolve.alias.set('react', path.resolve(__dirname, '..', 'node_modules', 'react'))
      chain.resolve.alias.set('react-dom', path.resolve(__dirname, '..', 'node_modules', 'react-dom'))
      chain.resolve.set('fallback', {
        crypto: false,
        stream: false,
        buffer: false
      })
      chain.optimization.splitChunks({
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          pdfLibs: {
            name: 'pagesPet/pdf-libs',
            test: /[\\/]node_modules[\\/](jspdf|html2canvas|pako|canvg|dompurify|css-line-break|html-entities)[\\/]/,
            priority: 200,
            reuseExistingChunk: true,
          },
          cryptoCore: {
            name: 'crypto-core',
            test: /[\\/]node_modules[\\/]crypto-js[\\/]/,
            priority: 100,
            reuseExistingChunk: true,
          },
        },
      })
      chain.performance.hints(false)
    },
    sass: {
      data: `@import "@/styles/global.scss";`
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
