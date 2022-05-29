import { PackageURL } from 'packageurl-js'
import { Dependency } from './dependency'

export class Graph {
  database: Record<string, Dependency>

  constructor() {
    this.database = {}
  }

  dependency(identifier: PackageURL | string): Dependency {
    const existingDep = this.lookupDependency(identifier)
    if (existingDep) {
      return existingDep
    }

    const dep = new Dependency(identifier)
    this.addDependency(dep)
    return dep
  }

  addDependency(dependency: Dependency) {
    this.database[dependency.packageURL.toString()] = dependency
  }

  removeDependency(dependency: Dependency) {
    delete this.database[dependency.packageURL.toString()]
  }

  lookupDependency(identifier: PackageURL | string): Dependency | undefined {
    if (typeof identifier === 'string') {
      const purl = PackageURL.fromString(identifier)
      return this.database[purl.toString()]
    } else {
      return this.database[identifier.toString()]
    }
  }

  countDependencies(): number {
    return Object.values(this.database).length
  }
}
