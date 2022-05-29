import { PackageURL } from 'packageurl-js'

export class Dependency {
  packageURL: PackageURL
  transitiveDependencies: Array<Dependency>

  constructor(pkg: PackageURL | string) {
    if (typeof pkg === 'string') {
      this.packageURL = PackageURL.fromString(pkg)
    } else {
      this.packageURL = pkg
    }
    this.transitiveDependencies = []
  }

  addTransitive(dependency: Dependency) {
    this.transitiveDependencies.push(dependency)
  }
}
