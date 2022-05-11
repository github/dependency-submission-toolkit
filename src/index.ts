import * as core from '@actions/core'
import * as github from '@actions/github'

import { ProcessDependenciesContent, readDependencies } from './processor'
import { Dependency, Detector, Manifest, Metadata, Snapshot } from './snapshot'

export async function run(
  parseDependentsFunction: ProcessDependenciesContent,
  manifestInfo: { path?: string; command?: string } = {},
  options: { metadata?: Metadata; detector?: Detector } = {}
): Promise<void> {
  const manifestLocation: string | undefined =
    manifestInfo.path || manifestInfo.command

  if (!manifestLocation) {
    throw new Error(
      'Must provide either a manifest file path or a manifest command.'
    )
  }

  const manifests = [new Manifest(manifestLocation)]

  const entries = await readDependencies(parseDependentsFunction, manifestInfo)

  const snapshot = new Snapshot(github.context, options)

  try {
    manifests.forEach((manifest: Manifest) => {
      if (entries !== undefined) {
        for (const [_, entry] of Object.entries(entries)) {
          const dependency = new Dependency(
            entry.package_url,
            entry.relationship,
            entry.scope
          )
          entry.dependencies?.forEach((transitiveEntry) => {
            const transitiveDep = new Dependency(
              transitiveEntry.package_url,
              entry.relationship,
              entry.scope
            )
            dependency.addTransitiveDependency(transitiveDep)
          })
          manifest.add(dependency)
        }
      }
      snapshot.add(manifest)
    })

    await snapshot.submit()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
