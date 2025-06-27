/// <reference types="vitest" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    alias: {
      '@': new URL('./lib', import.meta.url).pathname
    }
  },
  build: {
    lib: {
      entry: new URL('./lib/syncrate.ts', import.meta.url).pathname,
      name: 'syncrate',
      fileName: (format) => `syncrate.${format}.js`,
      formats: ['es', 'umd']
    }
  },
  test: {
    name: 'syncrate',
    root: './lib',
    environment: 'happy-dom',
    globals: true
  },
  plugins: [
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.json'
    })
  ]
})
