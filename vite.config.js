import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'
import dbJsonApiPlugin from './db-json-api-plugin.js'

export default defineConfig({
  plugins: [vue(), vueDevTools(), dbJsonApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
