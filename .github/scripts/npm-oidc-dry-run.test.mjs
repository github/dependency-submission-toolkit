import assert from 'node:assert/strict'
import test from 'node:test'

test('reports missing authentication warnings without exposing registry values', async () => {
  const { summarize } = await import('./npm-oidc-dry-run.mjs')
  for (const prefix of ['', 'publish ']) {
    assert.deepEqual(
      summarize(
        `npm warn ${prefix}This command requires you to be logged in to https://private-registry.example/ (dry-run)`
      ),
      ['npm: authentication unavailable (dry-run only)']
    )
  }
})

test('reports OIDC outcomes without echoing server messages or credentials', async () => {
  const { summarize } = await import('./npm-oidc-dry-run.mjs')
  const output = summarize(
    [
      'npm verbose oidc Failed token exchange request with body message: secret-server-body',
      'npm http fetch POST 404 https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/%40github%2fdependency-submission-toolkit 123ms',
      'npm verbose oidc Failure with message: secret-token',
      'npm error code ENEEDAUTH',
      'npm verbose unrelated secret-value'
    ].join('\n')
  )
  assert.deepEqual(output, [
    'OIDC: npm token exchange failed',
    'OIDC: npm token exchange HTTP 404',
    'OIDC: unexpected failure (details withheld)',
    'npm: ENEEDAUTH'
  ])
})

test('distinguishes missing permissions, identity failures and successful exchange', async () => {
  const { summarize } = await import('./npm-oidc-dry-run.mjs')
  assert.deepEqual(
    summarize(
      [
        'npm silly oidc Skipped because incorrect permissions for id-token within GitHub workflow',
        'npm verbose oidc Failed to fetch id_token from GitHub: received an invalid response',
        'npm verbose oidc Successfully retrieved and set token',
        'npm verbose oidc Failed because token exchange was missing the token in the response body',
        'npm silly oidc Skipped because no id_token available',
        'npm verbose oidc Failed to fetch id_token from GitHub: missing value'
      ].join('\n')
    ),
    [
      'OIDC: GitHub request variables missing',
      'OIDC: GitHub identity request failed',
      'OIDC: npm credentials obtained successfully',
      'OIDC: npm exchange returned no token',
      'OIDC: no identity token available',
      'OIDC: GitHub identity response contained no token'
    ]
  )
  assert.deepEqual(
    summarize('Authorization: Bearer secret\nnpm notice secret'),
    []
  )
})
