import { PackageURL } from 'packageurl-js'
import { Dependency } from './dependency'
import { Graph } from './graph'

const purl = 'pkg:npm/%40github/dependency-submission-toolkit@0.1.2'

describe('Graph', () => {
  describe('with no dependencies', () => {
    const graph = new Graph()
    it('adds and remove Dependency', () => {
      const dep = new Dependency(purl)
      graph.addDependency(dep)
      expect(graph.countDependencies()).toBe(1)
      graph.removeDependency(dep)
      expect(graph.countDependencies()).toBe(0)
    })
    it('constructs a dependency with .dependency using PackageURL', () => {
      const packageURL = new PackageURL(
        'npm',
        'github',
        'dependency-submission-toolkit',
        '0.1.2',
        null,
        null
      )
      const dep = graph.dependency(packageURL)
      expect(dep).toBeInstanceOf(Dependency)
      expect(graph.countDependencies()).toBe(1)

      // purposely using reference equality with 'toBe'
      expect(graph.dependency(packageURL)).toBe(dep)
    })
    it('constructs a dependency with .dependency using string', () => {
      const graph = new Graph()
      const dep = graph.dependency(purl)
      expect(dep).toBeInstanceOf(Dependency)
      expect(graph.countDependencies()).toBe(1)

      // purposely using reference equality with 'toBe'
      expect(graph.dependency(purl)).toBe(dep)
    })
  })
  describe('with existing dependency', () => { })
})
