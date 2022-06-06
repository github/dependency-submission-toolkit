import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { PackageURL } from 'packageurl-js'

import {
  Manifest,
  Snapshot,
  submitSnapshot,
  Recorder,
  ManifestRecorder,
  Metadata
} from '@github/dependency-submission-toolkit'
import { UsageInformation } from '../dist/recorder'

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

export function getManifest(npmPackage: NpmPackage): Manifest {
  var recorder = new Recorder()
  var manifestRecorder = recorder.createOrGetManifestRecorder(npmPackage.name, undefined, new Metadata())
  registerDependencies(undefined, manifestRecorder, npmPackage.dependencies)
  return manifestRecorder.manifest()
}

export function registerDependencies(parentDependency: PackageURL | undefined, manifestRecorder: ManifestRecorder, dependencies: Dependencies) {
  Object.entries(dependencies).map(([depName, dep]) => {
    const [namespace, name] = parseNameAndNamespace(depName)
    const purl = new PackageURL('npm', namespace, name, dep.version, null, null)

    manifestRecorder.registerUsage(purl, new UsageInformation({isDevDependency: false, isDirectDependency: false, parentIdentifier: parentDependency}))
  })
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
  const manifest = getManifest(npmPackage)
  // const buildTarget = createBuildTarget(npmPackage)
  const snapshot = new Snapshot()

  snapshot.addManifest(manifest)
  submitSnapshot(snapshot)
}
