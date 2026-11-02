import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

describe('Package entry points', () => {
  it.each(['commonjs', 'module'])('loads the %s build', (inputType) => {
    const load =
      inputType === 'commonjs'
        ? "const { Package } = require('@github/dependency-submission-toolkit')"
        : "import { Package } from '@github/dependency-submission-toolkit'"
    const result = spawnSync(
      process.execPath,
      [
        `--input-type=${inputType}`,
        '-e',
        `${load}; console.log(new Package('pkg:npm/example@1.0.0').name())`
      ],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        encoding: 'utf8'
      }
    )

    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout.trim()).toBe('example')
  })

  it('type-checks a CommonJS consumer', () => {
    const directory = mkdtempSync(join(tmpdir(), 'toolkit-types-'))
    try {
      const source = join(directory, 'consumer.cts')
      const entry = fileURLToPath(new URL('../dist/index.cjs', import.meta.url))
      writeFileSync(
        source,
        `import { Package } from ${JSON.stringify(
          entry
        )}\nnew Package('pkg:npm/example@1.0.0')`
      )
      const program = ts.createProgram([source], {
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        target: ts.ScriptTarget.ES2022,
        noEmit: true
      })
      const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        )

      expect(diagnostics).toEqual([])
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('includes the licenses of bundled dependencies', () => {
    const path = new URL('../dist/THIRD_PARTY_NOTICES.txt', import.meta.url)
    const notices = existsSync(path) ? readFileSync(path, 'utf8') : ''
    for (const license of [
      '@actions/core/LICENSE.md',
      '@actions/github/LICENSE.md',
      '@octokit/request-error/LICENSE'
    ]) {
      const text = readFileSync(
        new URL(`../node_modules/${license}`, import.meta.url),
        'utf8'
      )
      expect(notices).toContain(text.trim())
    }
  })
})
