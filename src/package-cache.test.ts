import { PackageURL } from 'packageurl-js'
import { Package } from './package'
import { PackageCache } from './package-cache'

const purl = 'pkg:npm/%40github/dependency-submission-toolkit@0.1.2'

describe('PackageCache', () => {
  describe('with no packages', () => {
    const cache = new PackageCache()
    it('adds and remove Package', () => {
      const dep = new Package(purl)
      cache.addPackage(dep)
      expect(cache.countPackages()).toBe(1)
      cache.removePackage(dep)
      expect(cache.countPackages()).toBe(0)
    })
    it('constructs a package with .package using PackageURL', () => {
      const packageURL = new PackageURL(
        'npm',
        'github',
        'dependency-submission-toolkit',
        '0.1.2',
        null,
        null
      )
      const dep = cache.package(packageURL)
      expect(dep).toBeInstanceOf(Package)
      expect(cache.countPackages()).toBe(1)

      // purposely using reference equality with 'toBe'
      expect(cache.package(packageURL)).toBe(dep)
    })
    it('constructs a package with .package using string', () => {
      const cache = new PackageCache()
      const dep = cache.package(purl)
      expect(dep).toBeInstanceOf(Package)
      expect(cache.countPackages()).toBe(1)

      // purposely using reference equality with 'toBe'
      expect(cache.package(purl)).toBe(dep)
    })
  })
})
