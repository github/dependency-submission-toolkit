import { PackageURL } from 'packageurl-js'
import { Package } from './package'

/**
 * Use Graph to define packages and the relationships between packages. You may
 * think of Graph as the universe of possible packages to be used in Manifests
 * and BuildTargets. Graph is not seralized to the Dependency Submission API.
 */
export class Graph {
  private database: Record<string, Package>

  constructor() {
    this.database = {}
  }

  /**
   * 'graph.package()' will be the most commonly used method of Graph.
   * package(identifier) will create and add a new Package to the Graph if no
   * Packaging with a matching identifer exists in Graph, or return an existing
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
   * addPackage adds a package, even if it already exists in the graph.
   *
   * @param {Package} pkg
   */
  addPackage(pkg: Package) {
    this.database[pkg.packageURL.toString()] = pkg
  }

  /**
   * removePackage a removes a package from the graph
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
    } else {
      return this.database[identifier.toString()]
    }
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
   * countPackages returns the total number of packages tracked in the graph
   *
   * @returns {number}
   */
  countPackages(): number {
    return Object.values(this.database).length
  }
}
