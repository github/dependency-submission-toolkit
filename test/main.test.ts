import { describe, expect, test } from '@jest/globals'

import { Manifest, MaxMetaDataKeys } from '../src/snapshot'

describe('Validates manifest file initialization', () => {
  test('can create a manifest file with a name', async () => {
    const jsManifest = new Manifest('package-lock.json')
    expect(jsManifest.name).toEqual('package-lock.json')
  })

  test('can create a manifest file with a name and file location', async () => {
    const jsManifest = new Manifest('package-lock.json', {
      source_location: '/path/to/package.json'
    })
    expect(jsManifest.name).toEqual('package-lock.json')
    expect(jsManifest.file?.source_location).toEqual('/path/to/package.json')
  })

  test('can create a manifest file with a name, file location, and valid metadata', async () => {
    const metadata = {
      foo: 1.0,
      bar: false,
      baz: 'somethingsomething',
      nullz: null
    }
    const jsManifest = new Manifest(
      'package-lock.json',
      {
        source_location: '/path/to/package.json'
      },
      metadata
    )
    expect(jsManifest.name).toEqual('package-lock.json')
    expect(jsManifest.file?.source_location).toEqual('/path/to/package.json')
    expect(jsManifest.metadata).toEqual(metadata)
  })

  test('cannot create a manifest file with invalid metadata', async () => {
    const metadata = {
      foo: 1.0,
      bar: false,
      baz: 'somethingsomething',
      nullz: null,
      fifth: 5,
      sixth: 6,
      seventh: 7,
      eigth: 8,
      ninth: 'one key too many'
    }
    expect(
      () =>
        new Manifest(
          'package-lock.json',
          {
            source_location: '/path/to/package.json'
          },
          metadata
        )
    ).toThrow(
      Error(
        'Manifest metadata must contain no more than ' +
          MaxMetaDataKeys +
          ' keys'
      )
    )
  })
})
