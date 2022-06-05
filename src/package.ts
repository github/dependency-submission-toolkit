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

  addTransitive(pkg: Package): Package {
    this.transitiveDependencies.push(pkg)
    return this
  }

  addTransitives(pkgs: Array<Package>): Package {
    pkgs.forEach((pkg) => this.addTransitive(pkg))
    return this
  }

  get transitiveNames() {
    return this.transitiveDependencies.map((dep) => dep.packageURL.toString())
  }

  packageID(): string {
    return this.packageURL.toString()
  }
}
