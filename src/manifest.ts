import { Package } from './package'

import { Metadata } from './metadata'

/**
 * FileInfo specifies where the manifest or build-target are specified in the repository.
 */
type FileInfo = {
  source_location?: string // eslint-disable-line camelcase
}

/**
 * DependencyRelationship is a notation of whether a dependency is requested
 * directly by this manifest, or is a dependency of another dependency.
 */
export type DependencyRelationship = 'direct' | 'indirect'

/**
 * DependencyScope is a notation of whether the dependency is required for the
 * primary build artifact (runtime), or is only used for development. Future
 * versions of this specification may allow for more granular scopes, like
 * `runtime:server`, `runtime:shipped`, `development:test`,
 * `development:benchmark`, and so on.
 */
export type DependencyScope = 'runtime' | 'development'

/**
 * Dependency.
 */
class Dependency {
  /**
   * @type {Package}
   */
  depPackage: Package
  /**
   * @type {DependencyRelationship}
   */
  relationship?: DependencyRelationship
  /**
   * @type {DependencyScope}
   */
  scope?: DependencyScope

  /**
   * constructor.
   *
   * @param {Package} depPackage
   * @param {DependencyRelationship} relationship
   * @param {DependencyScope} scope
   */
  constructor(
    depPackage: Package,
    relationship?: DependencyRelationship,
    scope?: DependencyScope
  ) {
    this.depPackage = depPackage
    this.relationship = relationship
    this.scope = scope
  }

  /**
   * toJSON.
   */
  toJSON() {
    return {
      package_url: this.depPackage.packageURL.toString(),
      relationship: this.relationship,
      scope: this.scope,
      dependencies: this.depPackage.packageDependencyIDs
    }
  }
}

/**
 * Manifest defines the dependencies and the relationships of those dependencies.
 */
export class Manifest {
  resolved: Record<string, Dependency>
  name: string
  file?: FileInfo
  metadata?: Metadata

  constructor(name: string, filePath?: string, metadata?: Metadata) {
    this.resolved = {}
    this.name = name
    if (filePath) {
      this.file = { source_location: filePath }
    }
    this.metadata = metadata
  }

  /**
   * addIndirectDependency adds a package as an indirect dependency to the
   * manifest. Direct dependencies take precendence over indirect dependencies
   * if a package is added as both.
   *
   * @param {Package} pkg
   * @param {DependencyScope} scope
   */
  addDirectDependency(pkg: Package, scope?: DependencyScope) {
    // will overwrite any previous indirect assigments
    this.resolved[pkg.packageID()] = new Dependency(pkg, 'direct', scope)
  }

  /**
   * addIndirectDependency adds a package as an indirect dependency to the
   * manifest. NOTE: if a dependency has been previously added as a direct
   * dependency, no change will happen (direct dependencies take precedence).
   *
   * @param {Package} pkg
   * @param {DependencyScope} scope dependency scope of the package
   */
  addIndirectDependency(pkg: Package, scope?: DependencyScope) {
    // nullish assigment to keep any previous assignments, including direct assigments
    this.resolved[pkg.packageID()] ??= new Dependency(pkg, 'indirect', scope)
  }

  hasDependency(pkg: Package): boolean {
    return this.lookupDependency(pkg) !== undefined
  }

  lookupDependency(pkg: Package): Dependency | undefined {
    return this.resolved[pkg.packageID()]
  }

  countDependencies(): number {
    return Object.keys(this.resolved).length
  }

  /**
   * filterDependencies. Given a predicate function (a function returning a
   * boolean for an input), return the packages that match the dependency
   * relationship. Used for getting filtered lists of direct/indirect packages,
   * runtime/development packages, etc.
   *
   * @param {Function} predicate
   * @returns {Array<Package>}
   */
  filterDependencies(predicate: (dep: Dependency) => boolean): Array<Package> {
    return Object.values(this.resolved).reduce<Array<Package>>((acc, dep) => {
      if (predicate(dep)) {
        acc.push(dep.depPackage)
      }
      return acc
    }, [])
  }

  /**
   * directDependencies returns list of packages that are specified as direct dependencies
   */
  directDependencies(): Array<Package> {
    return this.filterDependencies((dep) => dep.relationship === 'direct')
  }

  /**
   * indirectDependencies returns list of packages that are specified as indirect dependencies
   */
  indirectDependencies() {
    return this.filterDependencies((dep) => dep.relationship === 'indirect')
  }
}

/**
 * The dependencies used in a code artifact or "build target" are more
 * accurately determined by the build process or commands used to generate the
 * build target, rather than static processing of package files. BuildTarget is
 * a specialized case of Manifest intended to assist in capturing this
 * association of build target and dependencies.
 *
 * @extends {Manifest}
 */
export class BuildTarget extends Manifest {
  /**
   * addBuildDependency will add a package as a direct runtime dependency and all of
   * the package's transitive dependencies as indirect dependencies
   *
   * @param {Package} pkg package used to build the build target
   */
  addBuildDependency(pkg: Package) {
    this.addDirectDependency(pkg, 'runtime')
    pkg.dependencies.forEach((transDep) => {
      this.addIndirectDependency(transDep, 'runtime')
    })
  }
}
