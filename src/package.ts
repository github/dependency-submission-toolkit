import { PackageURL } from 'packageurl-js'

export class Package {
  packageURL: PackageURL
  transitiveDependencies: Array<Package>

  constructor(pkg: PackageURL | string) {
    if (typeof pkg === 'string') {
      this.packageURL = PackageURL.fromString(pkg)
    } else {
      this.packageURL = pkg
    }
    this.transitiveDependencies = []
  }

  addTransitive(pkg: Package) {
    this.transitiveDependencies.push(pkg)
  }

  get transitiveNames() {
    return this.transitiveDependencies.map((dep) => dep.packageURL.toString())
  }

  packageID(): string {
    return this.packageURL.toString()
  }
}
