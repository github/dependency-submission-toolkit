import { PackageURL } from 'packageurl-js'

import { Package } from './package.js'

/**
 * Use PackageCache to define packages and the relationships between packages. You may
 * think of PackageCache as the universe of possible packages to be used in Manifests
 * and BuildTargets. PackageCache is not serialized to the Dependency Submission API.
 */
export class PackageCache {
  private database: Record<string, Package>

  constructor() {
    this.database = {}
  }

  /**
   * 'cache.package()' will be the most commonly used method of PackageCache.
   * package(identifier) will create and add a new Package to the PackageCache if no
   * Packaging with a matching identifier exists in PackageCache, or return an existing
   * Package if a match is found. The mutation in this case is expected; do not
   * use package(identifier) to determine if a package is already added.
   * Instead, use hasPackage or lookupPackage.
   *
   *
   * @param {PackageURL | string} identifier PackageURL or string matching the Package URL format (https://github.com/package-url/purl-spec)
   * @returns {Package}
   */
  package(identifier: PackageURL | string): Package {
    const existingDep = this.lookupPackage(identifier)
    if (existingDep) {
      return existingDep
    }

    const dep = new Package(identifier)
    this.addPackage(dep)
    return dep
  }

  /**
   * Provided a "matcher" object with any of the string fields 'namespace',
   * 'name', or 'version', returns all packages matching fields specified by
   * the matcher stored by the PackageCache
   *
   * @param {Object} matcher
   * @returns {boolean}
   */
  packagesMatching(matcher: {
    namespace?: string
    name?: string
    version?: string
  }): Array<Package> {
    return Object.values(this.database).filter((pkg) => pkg.matching(matcher))
  }

  /**
   * addPackage adds a package, even if it already exists in the cache.
   *
   * @param {Package} pkg
   */
  addPackage(pkg: Package) {
    this.database[pkg.packageURL.toString()] = pkg
  }

  /**
   * removePackage a removes a package from the cache
   *
   * @param {Package} pkg
   */
  removePackage(pkg: Package) {
    delete this.database[pkg.packageURL.toString()]
  }

  /**
   * lookupPackage looks up and returns a package with a matching identifier,
   * if one exists.
   *
   * @param {PackageURL | string} identifier
   * @returns {Package | undefined}
   */
  lookupPackage(identifier: PackageURL | string): Package | undefined {
    if (typeof identifier === 'string') {
      const purl = PackageURL.fromString(identifier)
      return this.database[purl.toString()]
    }
    return this.database[identifier.toString()]
  }

  /**
   * hasPackage returns true if a package with a matching identifier exists.
   *
   * @param {PackageURL | string} identifier
   * @returns {boolean}
   */
  hasPackage(identifier: PackageURL | string): boolean {
    return this.lookupPackage(identifier) !== undefined
  }

  /**
   * countPackages returns the total number of packages tracked in the cache
   *
   * @returns {number}
   */
  countPackages(): number {
    return Object.values(this.database).length
  }
}
