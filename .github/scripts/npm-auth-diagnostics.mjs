import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

for (const [label, path] of [
  ['project', join(process.cwd(), '.npmrc')],
  [
    'user',
    process.env.npm_config_userconfig ||
      process.env.NPM_CONFIG_USERCONFIG ||
      join(homedir(), '.npmrc')
  ]
]) {
  let contents
  try {
    contents = readFileSync(path, 'utf8')
  } catch (error) {
    console.log(
      `${label} npmrc: ${error.code === 'ENOENT' ? 'absent' : 'unreadable'}`
    )
    if (error.code !== 'ENOENT') process.exitCode = 1
    continue
  }
  console.log(`${label} npmrc: present`)
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || /^[#;]/.test(trimmed)) continue
    const separator = trimmed.indexOf('=')
    if (separator < 0) continue
    const key = trimmed.slice(0, separator).trim().toLowerCase()
    const value = trimmed.slice(separator + 1).trim()
    if (key === 'registry') {
      console.log(
        `${label} registry: ${
          /^https:\/\/registry\.npmjs\.org\/?$/.test(value)
            ? 'https://registry.npmjs.org/'
            : 'other value (redacted)'
        }`
      )
    } else if (key.startsWith('@') && key.endsWith(':registry')) {
      console.log(`${label} scoped registry: present`)
    } else if (
      /(^|:)(_authtoken|_auth|username|_password|password|certfile|keyfile)$/.test(
        key
      )
    ) {
      console.log(`${label} auth setting: present`)
    } else if (key === 'always-auth') {
      console.log(
        `${label} always-auth: ${
          /^(true|false)$/.test(value) ? value : 'other value (redacted)'
        }`
      )
    }
  }
}

console.log(
  `NODE_AUTH_TOKEN: ${
    process.env.NODE_AUTH_TOKEN === undefined
      ? 'unset'
      : process.env.NODE_AUTH_TOKEN === ''
        ? 'empty'
        : 'present'
  }`
)
console.log(
  `GitHub OIDC request URL: ${
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL ? 'present' : 'absent'
  }`
)
console.log(
  `GitHub OIDC request token: ${
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN ? 'present' : 'absent'
  }`
)
console.log(
  'Only project/user files inspected; global config and environment registry overrides are not evaluated.'
)
