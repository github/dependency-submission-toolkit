import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { PackageURL } from 'packageurl-js'

import {
  Graph,
  BuildTarget,
  Package,
  Snapshot,
  submitSnapshot
} from '@github/dependency-submission-toolkit'

type Dependency = {
  version: string
  dependencies?: Dependencies
}

type Dependencies = { [name: string]: Dependency }

type NpmPackage = { name: string; version: string; dependencies: Dependencies }

export function parseNameAndNamespace(npmDepName: string): [string, string] {
  const namespaceAndName = npmDepName.split('/')

  if (namespaceAndName.length == 2) {
    return [encodeURIComponent(namespaceAndName[0]), namespaceAndName[1]]
  } else if (namespaceAndName.length == 1) {
    return ['', namespaceAndName[0]]
  } else {
    throw new Error(
      `expectation violated: package '${npmDepName}' has more than one slash (/) in name`
    )
  }
}

function parseDependencies(
  graph: Graph,
  dependencies: Dependencies
): Array<Package> {
  return Object.entries<Dependency>(dependencies).map(([depName, dep]) => {
    const [namespace, name] = parseNameAndNamespace(depName)
    const purl = new PackageURL('npm', namespace, name, dep.version, null, null)

    // if the package has already been added to the graph, return the package early
    if (graph.hasPackage(purl)) return graph.package(purl)

    let transitives = []
    // post-order traversal of the dependency tree with recursion.
    // Recursion is assumed not to blow the stack as dependency trees are
    // unlikely to have significant depth
    if (dep.dependencies !== undefined) {
      transitives.push(...parseDependencies(graph, dep.dependencies))
    }

    return graph
      .package(new PackageURL('npm', namespace, name, dep.version, null, null))
      .addTransitives(transitives)
  })
}

export function createBuildTarget(npmPackage: NpmPackage): BuildTarget {
  const graph = new Graph()
  const topLevelDependencies = parseDependencies(graph, npmPackage.dependencies)

  const buildTarget = new BuildTarget(npmPackage.name)
  topLevelDependencies.forEach((dep) => {
    buildTarget.addBuildDependency(dep)
  })
  return buildTarget
}

export async function main() {
  const prodPackages = await exec.getExecOutput('npm', [
    'ls',
    '--prod',
    '--all',
    '--json'
  ])
  if (prodPackages.exitCode !== 0) {
    core.error(prodPackages.stderr)
    core.setFailed("'npm ls' failed!")
    return
  }
  const npmPackage = JSON.parse(prodPackages.stdout) as NpmPackage
  const buildTarget = createBuildTarget(npmPackage)
  const snapshot = new Snapshot()
  snapshot.add(buildTarget)
  submitSnapshot(snapshot)
}
