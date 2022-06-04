import { Package } from './package'

// A notation of whether a dependency is requested directly
// by this manifest, or is a dependency of another dependency.
export type DependencyRelationship = 'direct' | 'indirect'

// A notation of whether the dependency is required for the primary
// build artifact (runtime), or is only used for development.
// Future versions of this specification may allow for more granular
// scopes, like `runtime:server`, `runtime:shipped`,
// `development:test`, `development:benchmark`.
export type DependencyScope = 'runtime' | 'development'

export class Dependency {
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

