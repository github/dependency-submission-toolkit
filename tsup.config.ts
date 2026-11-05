import { unlink, writeFile } from 'node:fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  dts: true,
  format: ['esm', 'cjs'],
  minify: true,
  sourcemap: true,
  splitting: true,
  target: 'node24',
  treeshake: true,
  async onSuccess() {
    // Load ESM with its import conditions instead of requiring ESM-only dependencies.
    await writeFile(
      'dist/index.cjs',
      "module.exports = require('./index.js')\n"
    )
    await unlink('dist/index.cjs.map')
  }
})
