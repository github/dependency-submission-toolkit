import { PackageURL } from 'packageurl-js'
import { Package } from './Package'
import { Graph } from './graph'

const purl = 'pkg:npm/%40github/dependency-submission-toolkit@0.1.2'

describe('Graph', () => {
  describe('with no packages', () => {
    const graph = new Graph()
    it('adds and remove Package', () => {
      const dep = new Package(purl)
      graph.addPackage(dep)
      expect(graph.countPackages()).toBe(1)
      graph.removePackage(dep)
      expect(graph.countPackages()).toBe(0)
    })
    it('constructs a package with .package using PackageURL', () => {
      const packageURL = new PackageURL(
        'npm',
        'github',
        'dependency-submission-toolkit',
        '0.1.2',
        null,
        null
      )
      const dep = graph.package(packageURL)
      expect(dep).toBeInstanceOf(Package)
      expect(graph.countPackages()).toBe(1)

      // purposely using reference equality with 'toBe'
      expect(graph.package(packageURL)).toBe(dep)
    })
    it('constructs a package with .package using string', () => {
      const graph = new Graph()
      const dep = graph.package(purl)
      expect(dep).toBeInstanceOf(Package)
      expect(graph.countPackages()).toBe(1)

      // purposely using reference equality with 'toBe'
      expect(graph.package(purl)).toBe(dep)
    })
  })
})
