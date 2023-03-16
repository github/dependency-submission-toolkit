import { context } from '@actions/github'

import { Manifest } from './manifest'
import { PackageCache } from './package-cache'
import { shaFromContext, Snapshot } from './snapshot'

function roundTripJSON(obj: any): object {
  return JSON.parse(JSON.stringify(obj))
}

const cache = new PackageCache()
cache
  .package('pkg:npm/%40github/dependency-submission-toolkit@0.1.2')
  .dependsOn(cache.package('pkg:npm/%40actions/core@1.6.0'))

const manifest = new Manifest('test', './some/test')
manifest.addDirectDependency(
  cache.package('pkg:npm/%40github/dependency-submission-toolkit@0.1.2')
)
manifest.addIndirectDependency(cache.package('pkg:npm/%40actions/core@1.6.0'))

// add bogus git data to the context
context.sha = '1000000000000000000000000000000000000000'
context.ref = 'foo/bar/baz'
context.eventName = 'push'

describe('Snapshot', () => {
  it('renders expected JSON', () => {
    const snapshot = new Snapshot(
      exampleDetector,
      context,
      exampleJob,
      exampleDate
    )
    snapshot.addManifest(manifest)
    expect(roundTripJSON(snapshot)).toEqual({
      detector: {
        name: 'test detector',
        url: 'https://github.com/github/dependency-submission-toolkit',
        version: '0.0.1'
      },
      version: 0,
      job: {
        id: '42',
        correlator: 'test'
      },
      ref: 'foo/bar/baz',
      scanned: '2022-06-04T05:07:06.457Z',
      sha: '1000000000000000000000000000000000000000',
      manifests: {
        test: {
          resolved: {
            'pkg:npm/%40github/dependency-submission-toolkit@0.1.2': {
              package_url:
                'pkg:npm/%40github/dependency-submission-toolkit@0.1.2',
              relationship: 'direct',
              dependencies: ['pkg:npm/%40actions/core@1.6.0']
            },
            'pkg:npm/%40actions/core@1.6.0': {
              package_url: 'pkg:npm/%40actions/core@1.6.0',
              relationship: 'indirect',
              dependencies: []
            }
          },
          name: 'test',
          file: {
            source_location: './some/test'
          }
        }
      }
    })
  })

  it('gets the correct sha from the context when given a pull request', () => {
    const prContext = context
    const expectedSha = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'
    prContext.eventName = 'pull_request'
    prContext.payload.pull_request = {
      number: 1,
      head: {
        sha: expectedSha
      }
    }

    const snapshot = new Snapshot(
      exampleDetector,
      prContext,
      exampleJob,
      exampleDate
    )

    expect(snapshot.sha).toEqual(expectedSha)
  })
})

describe('shaFromContext', () => {
  it('gets the right sha from the context when given a pull_request event', () => {
    const expectedSha = '1234567890123456789012345678901234567890'
    const prContext = context
    prContext.eventName = 'pull_request'
    prContext.payload.pull_request = {
      number: 1,
      head: {
        sha: expectedSha
      }
    }
    expect(shaFromContext(prContext)).toEqual(expectedSha)
  })

  it('gets the right sha from the context when given a pull_request_review event', () => {
    const expectedSha = 'abcdef1234567890123456789012345678901234'
    const prReviewContext = context
    prReviewContext.eventName = 'pull_request_review'
    prReviewContext.payload.pull_request = {
      number: 1,
      head: {
        sha: expectedSha
      }
    }
    expect(shaFromContext(prReviewContext)).toEqual(expectedSha)
  })

  it('uses the primary sha from the context when given a push event', () => {
    const expectedSha = 'def1234567890123456789012345678901234567'
    const pushContext = context
    pushContext.eventName = 'push'
    pushContext.sha = expectedSha
    expect(shaFromContext(pushContext)).toEqual(expectedSha)
  })
})

const exampleDetector = {
  name: 'test detector',
  url: 'https://github.com/github/dependency-submission-toolkit',
  version: '0.0.1'
}

const exampleJob = {
  id: '42',
  correlator: 'test'
}

const exampleDate = new Date('2022-06-04T05:07:06.457Z')
