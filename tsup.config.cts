import { mkdirSync } from 'node:fs'
import esbuildLicense = require('esbuild-plugin-license')
import { defineConfig } from 'tsup'

// The license plugin writes before tsup creates the output directory.
mkdirSync('dist', { recursive: true })

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  // Inline Context types instead of importing ESM-only modules from .d.cts.
  dts: { resolve: ['@actions/github', /^\./] },
  format: ['esm', 'cjs'],
  // Bundled CommonJS dependencies need require in the ESM output.
  banner: ({ format }) =>
    format === 'esm'
      ? {
          js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"
        }
      : {},
  esbuildPlugins: [
    esbuildLicense.default({
      thirdParty: {
        output: {
          file: 'THIRD_PARTY_NOTICES.txt',
          template: (dependencies) =>
            dependencies
              .map(
                ({ packageJson, licenseText }) =>
                  `${packageJson.name}@${packageJson.version}\n\n${licenseText}`
              )
              .join('\n\n')
        }
      }
    })
  ],
  minify: true,
  sourcemap: true,
  splitting: true,
  target: 'node20',
  treeshake: true
})
