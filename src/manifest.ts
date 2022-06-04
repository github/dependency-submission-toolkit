import { Package } from './package'

import { Metadata } from './metadata'

/**
 * Manifest.
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
}

export type FileInfo = {
  source_location?: string // eslint-disable-line camelcase
}

// A notation of whether the dependency is required for the primary
// build artifact (runtime), or is only used for development.
// Future versions of this specification may allow for more granular
// scopes, like `runtime:server`, `runtime:shipped`,
// `development:test`, `development:benchmark`.
export type DependencyScope = 'runtime' | 'development'

class Dependency {
  constructor(
    public depPackage: Package,
    public relationship?: DependencyRelationship,
    public scope?: DependencyScope
  ) {}

  toJson() {
    return JSON.stringify({
      package_url: this.depPackage.packageURL.toString(),
      relationship: this.relationship,
      scope: this.scope,
      dependencies: this.depPackage.transitiveNames
    })
  }
}

// A notation of whether a dependency is requested directly
// by this manifest, or is a dependency of another dependency.
export type DependencyRelationship = 'direct' | 'indirect'

export class BuildTarget extends Manifest {
  constructor(name: string, filePath?: string, metadata?: Metadata) {
    super(name, filePath, metadata)
  }

  /**
   * addBuildDependency will add a package as a direct runtime dependency and all of
   * the packages transitive dependencies as indirect dependencies
   *
   * @param {Package} pkg package used to build the build target
   */
  addBuildDependency(pkg: Package) {
    this.addDirectDependency(pkg, 'runtime')
    pkg.transitiveDependencies.forEach((transDep) => {
      this.addIndirectDependency(transDep, 'runtime')
    })
  }
}
