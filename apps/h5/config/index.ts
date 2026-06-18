import { defineConfig, type UserConfigExport } from '@tarojs/cli'

export default defineConfig<'webpack5'>((merge, { command, mode }) => {
  const config: UserConfigExport<'webpack5'> = {
    projectName: 'xingzhe-v3-h5',
    date: '2026-6-16',

    designWidth: 750,

    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2
    },

    sourceRoot: 'src',
    outputRoot: 'dist',

    plugins: [
      '@tarojs/plugin-platform-h5',
      '@tarojs/plugin-framework-react'
    ],

    framework: 'react',

    compiler: {
      type: 'webpack5',
      prebundle: {
        enable: false
      }
    },

    cache: {
      enable: false
    },

    defineConstants: {},

    copy: {
      patterns: [],
      options: {}
    },

    mini: {},

    h5: {
      publicPath: '/',
      staticDirectory: 'static',

      router: {
        mode: 'hash'
      },

      webpackChain(chain) {
        chain.plugins.delete('progress')
        chain.plugins.delete('ProgressPlugin')
        chain.plugin('progress').use(require('webpack').ProgressPlugin, [])
        return chain
      }
    }
  }

  return config
})