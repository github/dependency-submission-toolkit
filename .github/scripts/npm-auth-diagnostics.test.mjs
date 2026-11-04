import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(
  new URL('./npm-auth-diagnostics.mjs', import.meta.url)
)

test('reports configuration and OIDC availability without exposing credentials', () => {
  const directory = mkdtempSync(
    join(process.env.TMPDIR, 'npm-auth-diagnostics-')
  )
  const projectConfig = [
    'registry=https://private-user:private-password@registry.example/private-path',
    '@private-scope:registry=https://registry.example',
    '//registry.example/:_authToken=private-config-token',
    'always-auth=true'
  ].join('\n')
  const userConfig =
    '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\nregistry=https://registry.npmjs.org/\n'
  try {
    writeFileSync(join(directory, '.npmrc'), projectConfig)
    writeFileSync(join(directory, 'user.npmrc'), userConfig)
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      encoding: 'utf8',
      env: {
        HOME: directory,
        NPM_CONFIG_USERCONFIG: join(directory, 'user.npmrc'),
        NODE_AUTH_TOKEN: '',
        ACTIONS_ID_TOKEN_REQUEST_URL: 'https://private-oidc-url',
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'private-oidc-token'
      }
    })
    assert.match(result.stdout, /project registry: other value \(redacted\)/)
    assert.match(result.stdout, /project scoped registry: present/)
    assert.match(result.stdout, /project auth setting: present/)
    assert.match(result.stdout, /project always-auth: true/)
    assert.match(result.stdout, /user registry: https:\/\/registry.npmjs.org\//)
    assert.match(result.stdout, /user auth setting: present/)
    assert.match(result.stdout, /NODE_AUTH_TOKEN: empty/)
    assert.match(result.stdout, /GitHub OIDC request URL: present/)
    assert.match(result.stdout, /GitHub OIDC request token: present/)
    assert.equal(result.status, 0)
    assert.equal(result.stderr, '')
    assert.doesNotMatch(result.stdout, /private-|registry\.example/)
    assert.equal(readFileSync(join(directory, '.npmrc'), 'utf8'), projectConfig)
    assert.equal(
      readFileSync(join(directory, 'user.npmrc'), 'utf8'),
      userConfig
    )
  } finally {
    rmSync(directory, { recursive: true })
  }
})

test('reports missing configuration and token presence without printing its value', () => {
  const directory = mkdtempSync(
    join(process.env.TMPDIR, 'npm-auth-diagnostics-')
  )
  try {
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      encoding: 'utf8',
      env: { HOME: directory, NODE_AUTH_TOKEN: 'private-token' }
    })
    assert.match(result.stdout, /project npmrc: absent/)
    assert.match(result.stdout, /user npmrc: absent/)
    assert.match(result.stdout, /NODE_AUTH_TOKEN: present/)
    assert.match(result.stdout, /GitHub OIDC request URL: absent/)
    assert.match(result.stdout, /GitHub OIDC request token: absent/)
    assert.equal(result.status, 0)
    assert.equal(result.stderr, '')
    assert.doesNotMatch(result.stdout, /private-token/)
  } finally {
    rmSync(directory, { recursive: true })
  }
})
