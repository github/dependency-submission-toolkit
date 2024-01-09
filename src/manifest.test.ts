import { describe, expect, it } from 'vitest'

import { Manifest } from './manifest.js'
import { PackageCache } from './package-cache.js'

const cache = new PackageCache()
cache
  .package('pkg:npm/%40github/dependency-submission-toolkit@0.1.2')
  .dependsOn(cache.package('pkg:npm/%40actions/core@1.6.0'))

function roundTripJSON(obj: unknown): object {
  return JSON.parse(JSON.stringify(obj))
}

describe('Manifest', () => {
  it('renders expected JSON', () => {
    const manifest = new Manifest('test', './some/test')
    manifest.addDirectDependency(
      cache.package('pkg:npm/%40github/dependency-submission-toolkit@0.1.2')
    )
    manifest.addIndirectDependency(
      cache.package('pkg:npm/%40actions/core@1.6.0')
    )
    expect(roundTripJSON(manifest)).toEqual({
      file: {
        source_location: './some/test'
      },
      name: 'test',
      resolved: {
        'pkg:npm/%40actions/core@1.6.0': {
          dependencies: [],
          package_url: 'pkg:npm/%40actions/core@1.6.0',
          relationship: 'indirect'
        },
        'pkg:npm/%40github/dependency-submission-toolkit@0.1.2': {
          dependencies: ['pkg:npm/%40actions/core@1.6.0'],
          package_url: 'pkg:npm/%40github/dependency-submission-toolkit@0.1.2',
          relationship: 'direct'
        }
      }
    })
  })
})
