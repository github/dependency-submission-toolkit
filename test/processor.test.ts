import { describe, expect, test } from '@jest/globals'
import { readDependencies, ParsedDependencies, Entry } from '../src/processor'

describe('readDependencies', () => {
  test('test readDependencies with path supplied', async () => {
    const result = await readDependencies(
      (contents) => {
        const dependencies: ParsedDependencies = {}
        contents.split('\n').forEach((dep) => {
          if (dep.length < 1) {
            return
          }
          const purl = `pkg://${dep}@1`
          dependencies[purl] = new Entry(purl)
        })
        return dependencies
      },
      {
        path: 'test/dependencies.txt'
      }
    )

    const keys = Object.keys(result!)
    expect(keys).toEqual(['pkg://foo@1', 'pkg://bar@1', 'pkg://baz@1'])
  })

  test('test readDependencies with command supplied', async () => {
    const result = await readDependencies(
      (contents) => {
        const dependencies: ParsedDependencies = {}
        contents.split('\n').forEach((dep) => {
          if (dep.length < 1) {
            return
          }
          const purl = `pkg://${dep}@1`
          dependencies[purl] = new Entry(purl)
        })
        return dependencies
      },
      {
        command: 'cat test/dependencies.txt'
      }
    )

    const keys = Object.keys(result!)
    expect(keys).toEqual(['pkg://foo@1', 'pkg://bar@1', 'pkg://baz@1'])
  })
})
