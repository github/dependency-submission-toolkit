import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
  minify: true,
  sourcemap: true,
  splitting: true,
  target: 'node20',
  treeshake: true
})
