import {setFailed} from '@actions/core'
import {context} from '@actions/github'

import {ProcessDependenciesContent, readDependencies} from './processor'
import {Dependency, Detector, Manifest, Metadata, Snapshot} from './snapshot'

export async function run(
  parseDependentsFunction: ProcessDependenciesContent,
  manifestInfo: {path?: string; command?: string} = {},
  options: {metadata?: Metadata; detector?: Detector} = {}
): Promise<void> {
  const manifestLocation: string | undefined = manifestInfo.path || manifestInfo.command

  if (!manifestLocation) {
    throw new Error('Must provide either a manifest file path or a manifest command.')
  }

  const manifests = [new Manifest(manifestLocation)]

  const entries = await readDependencies(parseDependentsFunction, manifestInfo)

  const snapshot = new Snapshot(context, options)

  try {
    for (const manifest of manifests) {
      if (entries !== undefined) {
        for (const [, entry] of Object.entries(entries)) {
          const dependency = new Dependency(entry.package_url, entry.relationship, entry.scope)
          for (const transitiveEntry of entry.dependencies ? entry.dependencies : []) {
            const transitiveDep = new Dependency(transitiveEntry.package_url, entry.relationship, entry.scope)
            dependency.addTransitiveDependency(transitiveDep)
          }
          manifest.add(dependency)
        }
      }
      snapshot.add(manifest)
    }

    await snapshot.submit()
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}
