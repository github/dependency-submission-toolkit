import { context } from '@actions/github'

import { Manifest } from './manifest'
import { Graph } from './graph'
import { Metadata } from './metadata'
import { Snapshot } from './snapshot'

function roundTripJSON(obj: any): object {
  return JSON.parse(JSON.stringify(obj))
}

const graph = new Graph()
graph
  .package('pkg:npm/%40github/dependency-submission-toolkit@0.1.2')
  .addTransitive(graph.package('pkg:npm/%40actions/core@1.6.0'))

const manifest = new Manifest(
  'test',
  './some/test',
  new Metadata().set('hello', 'world')
)
manifest.addDirectDependency(
  graph.package('pkg:npm/%40github/dependency-submission-toolkit@0.1.2')
)
manifest.addIndirectDependency(graph.package('pkg:npm/%40actions/core@1.6.0'))

describe('Snapshot', () => {
  it('renders expected JSON', () => {
    const snapshot = new Snapshot(
      context,
      { id: 42, correlator: 'test' },
      {
        name: 'test detector',
        url: 'https://github.com/github/dependency-submission-toolkit',
        version: '0.0.1'
      },
      new Metadata().set('hello', 'snapshot'),
      new Date('2022-06-04T05:07:06.457Z')
    )
    snapshot.addManifest(manifest)

    expect(roundTripJSON(snapshot)).toEqual({
      detector: {
        name: 'test detector',
        url: 'https://github.com/github/dependency-submission-toolkit',
        version: '0.0.1'
      },
      metadata: {
        hello: 'snapshot'
      },
      version: 0,
      job: {
        id: 42,
        correlator: 'test'
      },
      scanned: '2022-06-04T05:07:06.457Z',
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
          },
          metadata: {
            hello: 'world'
          }
        }
      }
    })
  })
})
