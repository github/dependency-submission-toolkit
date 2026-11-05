import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'

const directory = mkdtempSync(join(tmpdir(), 'dependency-submission-consumer-'))

before(() => {
  const { npm_execpath: npm } = process.env
  assert.ok(npm, 'Run this test with npm run test:package')
  const [packed] = JSON.parse(
    execFileSync(
      process.execPath,
      [
        npm,
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        directory
      ],
      { encoding: 'utf8' }
    )
  )
  execFileSync(
    process.execPath,
    [
      npm,
      'install',
      '--prefix',
      directory,
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      join(directory, packed.filename)
    ],
    { stdio: 'pipe' }
  )
})

after(() => {
  rmSync(directory, { recursive: true })
})

for (const mode of ['commonjs', 'module']) {
  test(`packed package creates dependency snapshots through ${mode}`, () => {
    const load =
      mode === 'commonjs'
        ? "const toolkit = require('@github/dependency-submission-toolkit')"
        : "import * as toolkit from '@github/dependency-submission-toolkit'"
    execFileSync(
      process.execPath,
      [
        `--input-type=${mode}`,
        '-e',
        `
          ${load}
          const cache = new toolkit.PackageCache()
          const manifest = new toolkit.Manifest('package.json', './package.json')
          manifest.addDirectDependency(cache.package('pkg:npm/example@1.0.0'))
          const snapshot = new toolkit.Snapshot(
            {name: 'test', url: 'https://example.com', version: '1.0.0'},
            {job: 'test', runId: 1, sha: 'abc', ref: 'refs/heads/main', eventName: 'push'}
          )
          snapshot.addManifest(manifest)
          const result = JSON.parse(snapshot.prettyJSON())
          if (result.sha !== 'abc' || !result.manifests['package.json'].resolved['pkg:npm/example@1.0.0']) {
            throw new Error('Snapshot did not contain the expected dependency')
          }
        `
      ],
      { cwd: directory, stdio: 'pipe' }
    )
  })
}

test('CommonJS and ESM consumers share the same exported classes', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=commonjs',
      '-e',
      `
        const cjs = require('@github/dependency-submission-toolkit')
        import('@github/dependency-submission-toolkit').then(esm => {
          if (cjs.Snapshot !== esm.Snapshot || cjs.Manifest !== esm.Manifest) {
            throw new Error('Entry points expose different classes')
          }
          console.log('shared')
        })
      `
    ],
    { cwd: directory, encoding: 'utf8' }
  )
  assert.equal(output.trim(), 'shared')
})
