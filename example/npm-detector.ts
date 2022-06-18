import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { PackageURL } from 'packageurl-js'

import {
  PackageCache,
  BuildTarget,
  Package,
  Snapshot,
  submitSnapshot
} from '@github/dependency-submission-toolkit'

// top-level structure from the output of 'npm list'
type NpmPackage = { name: string; version: string; dependencies: Dependencies }

type Dependency = {
  version: string
  dependencies?: Dependencies
}

type Dependencies = { [name: string]: Dependency }

/**
 * parseNameAndNamespace parses the name and namespace from a NPM package name.
 * Namespace and name are URL-safe encoded, as expected by PackageURL
 *
 * @param {string} npmDepName
 * @returns {[string, string]} tuple of namespace and name
 */
export function parseNameAndNamespace(npmDepName: string): [string, string] {
  const namespaceAndName = npmDepName.split('/')

  if (namespaceAndName.length == 2) {
    return [
      encodeURIComponent(namespaceAndName[0]),
      encodeURIComponent(namespaceAndName[1])
    ]
  } else if (namespaceAndName.length == 1) {
    return ['', encodeURIComponent(namespaceAndName[0])]
  } else {
    throw new Error(
      `expectation violated: package '${npmDepName}' has more than one slash (/) in name`
    )
  }
}

/**
 * parseDependencies recursively parses the dependency tree provided by 'npm
 * list' and returns an array of the top-level parent packages. If a package
 * has already been added to the PackageCache, it does not reprocess its dependencies.
 */
export function parseDependencies(
  cache: PackageCache,
  dependencies: Dependencies
): Array<Package> {
  return Object.entries<Dependency>(dependencies).map(([depName, dep]) => {
    const [namespace, name] = parseNameAndNamespace(depName)
    const purl = new PackageURL('npm', namespace, name, dep.version, null, null)

    // if the package has already been added to the cache, return the package early
    if (cache.hasPackage(purl)) return cache.package(purl)

    let pkgs = []
    // post-order traversal of the dependency tree with recursion.
    // recursion is not expected to blow the stack as dependency trees are
    // unlikely to have significant depth
    if (dep.dependencies !== undefined) {
      pkgs.push(...parseDependencies(cache, dep.dependencies))
    }

    return cache
      .package(new PackageURL('npm', namespace, name, dep.version, null, null))
      .dependsOnPackages(pkgs)
  })
}

/**
 * createBuildTarget creates a BuildTarget--a specialized sub-class of Manifest
 * intended to capture the dependencies of a specific build-target, rather
 * than all packages provided by the manifest environment. It parses the output
 * from 'npm list' and distinguishes between direct dependencies (those the
 * build-target explicity depends on) and indirect (transitive dependencies of
 * the direct dependencies). It identifies all dependency packages as
 * 'runtime',  since no development packages are included in a build-target.
 *
 * @param {NpmPackage} npmPackage
 * @returns {BuildTarget}
 */
export function createBuildTarget(npmPackage: NpmPackage): BuildTarget {
  const cache = new PackageCache()
  const topLevelDependencies = parseDependencies(cache, npmPackage.dependencies)

  const buildTarget = new BuildTarget(npmPackage.name)
  topLevelDependencies.forEach((dep) => {
    buildTarget.addBuildDependency(dep)
  })
  return buildTarget
}

// This program uses 'npm list' to provide a list of all production
// (non-development) dependencies and all transitive dependencies. This
// provides transitive relationships unlike package.json, and output can be
// configured to avoid issues present with parsing package-lock.json (such as
// inclusion of workspace packages). This is provided as example to help guide
// development.
export async function main() {
  const npmPackageDirectory = core.getInput('npm-package-directory')
  const prodPackages = await exec.getExecOutput(
    'npm',
    ['list', '--prod', '--all', '--json'],
    { cwd: npmPackageDirectory }
  )
  if (prodPackages.exitCode !== 0) {
    core.error(prodPackages.stderr)
    core.setFailed("'npm ls' failed!")
    return
  }
  const npmPackage = JSON.parse(prodPackages.stdout) as NpmPackage
  const buildTarget = createBuildTarget(npmPackage)
  const snapshot = new Snapshot({
    name: 'example NPM detector',
    url: 'https://github.com/github/dependency-submission-toolkit/tree/main/example',
    version: '0.0.1'
  })
  snapshot.addManifest(buildTarget)
  submitSnapshot(snapshot)
}
