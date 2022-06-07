import {
  parseNameAndNamespace,
  parseDependencies,
  createBuildTarget
} from './npm-detector'

import { PackageCache } from '@github/dependency-submission-toolkit'

describe('parseNameAndNamespace', () => {
  test('parses single name, no namespace', () => {
    expect(parseNameAndNamespace('left-pad')).toEqual(['', 'left-pad'])
  })

  test('parses namespace and name', () => {
    expect(parseNameAndNamespace('beware/left-pad')).toEqual([
      'beware',
      'left-pad'
    ])
  })

  test('url-encodes namespace and name', () => {
    expect(parseNameAndNamespace('@actions/core')).toEqual([
      '%40actions',
      'core'
    ])
  })

  test('throws error if multiple slashes', () => {
    expect(() => {
      parseNameAndNamespace('foo/bar/baz')
    }).toThrow()
  })
})

describe('parseDependencies', () => {
  test('parse single dependency', () => {
    const dependencies = { foo: { version: '1.0' } }
    const cache = new PackageCache()
    const pkgs = parseDependencies(cache, dependencies)

    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].packageID()).toEqual('pkg:npm/foo@1.0')
    expect(cache.countPackages()).toEqual(1)
  })

  test('parse multiple dependencies, single depth', () => {
    const dependencies = { foo: { version: '1.0' }, bar: { version: '2.0' } }
    const cache = new PackageCache()
    const pkgs = parseDependencies(cache, dependencies)

    expect(pkgs).toHaveLength(2)
    expect(pkgs[0].packageID()).toEqual('pkg:npm/foo@1.0')
    expect(pkgs[1].packageID()).toEqual('pkg:npm/bar@2.0')
    expect(cache.countPackages()).toEqual(2)
  })

  test('parse multiple depth', () => {
    const dependencies = {
      foo: { version: '1.0', dependencies: { bar: { version: '2.0' } } }
    }
    const cache = new PackageCache()
    const pkgs = parseDependencies(cache, dependencies)

    expect(pkgs).toHaveLength(1)
    expect(pkgs[0].packageID()).toEqual('pkg:npm/foo@1.0')
    expect(pkgs[0].packageDependencyIDs).toHaveLength(1)
    expect(pkgs[0].packageDependencyIDs[0]).toEqual('pkg:npm/bar@2.0')
    expect(cache.countPackages()).toEqual(2)
  })
})

describe('createBuildTarget', () => {
  test('parse npm package', () => {
    const npmPackage = {
      name: 'example-package',
      version: '0.0',
      dependencies: {
        foo: { version: '1.0', dependencies: { bar: { version: '2.0' } } },
        baz: { version: '3.0' }
      }
    }

    const buildTarget = createBuildTarget(npmPackage)
    expect(buildTarget.name).toEqual('example-package')
    expect(buildTarget.directDependencies()).toHaveLength(2)
    expect(buildTarget.indirectDependencies()).toHaveLength(1)
  })
})
