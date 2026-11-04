import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export function summarize(output) {
  const messages = [
    [
      'Skipped because incorrect permissions for id-token',
      'GitHub request variables missing'
    ],
    [
      'Failed to fetch id_token from GitHub: received an invalid response',
      'GitHub identity request failed'
    ],
    [
      'Failed to fetch id_token from GitHub: missing value',
      'GitHub identity response contained no token'
    ],
    ['Skipped because no id_token available', 'no identity token available'],
    [
      'Failed token exchange request with body message:',
      'npm token exchange failed'
    ],
    [
      'Failed because token exchange was missing the token',
      'npm exchange returned no token'
    ],
    [
      'Successfully retrieved and set token',
      'npm credentials obtained successfully'
    ],
    ['Failure with message:', 'unexpected failure (details withheld)']
  ]
  const results = []
  for (const line of output.split(/\r?\n/)) {
    if (/^npm (verbose|silly) oidc /.test(line)) {
      for (const [prefix, description] of messages) {
        if (line.includes(prefix)) results.push(`OIDC: ${description}`)
      }
    }
    const exchange = line.match(
      /^npm http fetch POST ([1-5][0-9]{2}) https:\/\/registry\.npmjs\.org\/-\/npm\/v1\/oidc\/token\/exchange\/package\//
    )
    if (exchange) results.push(`OIDC: npm token exchange HTTP ${exchange[1]}`)
    if (line === 'npm error code ENEEDAUTH') results.push('npm: ENEEDAUTH')
  }
  return results
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  // Never forward npm output: even verbose error bodies can contain credentials.
  const result = spawnSync(
    'npm',
    [
      'publish',
      '--dry-run',
      '--provenance',
      '--access',
      'public',
      '--tag',
      'oidc-test',
      '--loglevel=silly'
    ],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  )
  const summaries = summarize(`${result.stdout || ''}\n${result.stderr || ''}`)
  for (const summary of summaries) console.log(summary)
  if (!summaries.length) console.log('OIDC: no recognized diagnostic messages')
  console.log(`npm dry-run: ${result.status === 0 ? 'passed' : 'failed'}`)
  process.exitCode = result.status ?? 1
}
