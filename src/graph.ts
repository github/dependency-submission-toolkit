import { PackageURL } from 'packageurl-js'
import { Package } from './package'

export class Graph {
  database: Record<string, Package>

  constructor() {
    this.database = {}
  }

  package(identifier: PackageURL | string): Package {
    const existingDep = this.lookupPackage(identifier)
    if (existingDep) {
      return existingDep
    }

    const dep = new Package(identifier)
    this.addPackage(dep)
    return dep
  }

  addPackage(pkg: Package) {
    this.database[pkg.packageURL.toString()] = pkg
  }

  removePackage(pkg: Package) {
    delete this.database[pkg.packageURL.toString()]
  }

  lookupPackage(identifier: PackageURL | string): Package | undefined {
    if (typeof identifier === 'string') {
      const purl = PackageURL.fromString(identifier)
      return this.database[purl.toString()]
    } else {
      return this.database[identifier.toString()]
    }
  }

  hasPackage(identifier: PackageURL | string): boolean {
    return this.lookupPackage(identifier) !== undefined
  }

  countPackages(): number {
    return Object.values(this.database).length
  }
}
