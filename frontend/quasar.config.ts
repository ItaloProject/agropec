import { configure } from 'quasar/wrappers'

export default configure(function (/* ctx */) {
  return {
    eslint: { fix: false },

    boot: ['pinia', 'axios'],

    css: ['app.scss'],

    extras: [
      'material-icons',
      'material-symbols-outlined',
      'fontawesome-v6',
      'roboto-font',
    ],

    build: {
      target: { browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'] },
      vueRouterMode: 'hash',
      typescript: { strict: true },

      vitePlugins: [],
    },

    devServer: {
      open: false,
      port: 9000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
        },
      },
    },

    framework: {
      config: {
        notify: { position: 'top-right', timeout: 3000 },
        loading: { spinnerColor: 'primary' },
      },
      plugins: ['Notify', 'Dialog', 'Loading', 'LocalStorage'],
    },

    animations: [],

    ssr: { pwa: false, prodPort: 3000, middlewares: ['render'] },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestFetch: false,
    },
  }
})
