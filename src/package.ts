import { PackageURL } from 'packageurl-js'

/**
 * Package is module that can be depended upon in manifest or build target. A
 * package is what you would download from a registry like NPM.
 */
export class Package {
  /**
   * @type {PackageURL}
   */
  packageURL: PackageURL
  /**
   * @type {Array<Package>}
   */
  transitiveDependencies: Array<Package> // eslint-disable-line no-use-before-define

  /**
   * A Package can be constructed with a PackageURL or a string conforming to
   * the Package URL format (https://github.com/package-url/purl-spec)
   *
   * @param {PackageURL | string} pkg
   */
  constructor(pkg: PackageURL | string) {
    if (typeof pkg === 'string') {
      this.packageURL = PackageURL.fromString(pkg)
    } else {
      this.packageURL = pkg
    }
    this.transitiveDependencies = []
  }

  /**
   * Associate a transitive depdendency with this package.
   *
   * @param {Package} pkg
   * @returns {Package}
   */
  addTransitive(pkg: Package): Package {
    this.transitiveDependencies.push(pkg)
    return this
  }

  /**
   * Add multiple packages as transitive dependencies.
   *
   * @param {Array} pkgs
   * @returns {Package}
   */
  addTransitives(pkgs: Array<Package>): Package {
    pkgs.forEach((pkg) => this.addTransitive(pkg))
    return this
  }

  /**
   * transitiveIDs provides the list of IDs of transitive dependencies
   */
  get transitiveIDs() {
    return this.transitiveDependencies.map((dep) => dep.packageID())
  }

  /**
   * packageID generates the unique package ID (currently, the Package URL)
   *
   * @returns {string}
   */
  packageID(): string {
    return this.packageURL.toString()
  }

  /**
   * name of the package
   *
   * @returns {string}
   */
  name(): string {
    return this.packageURL.name
  }

  /**
   * version of the package
   *
   * @returns {string}
   */
  version(): string {
    return this.packageURL.version || ''
  }
}
