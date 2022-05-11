/* eslint-disable camelcase */
import { Context } from '@actions/github/lib/context'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'

/*
Core functionality for creating a snapshot of a project's dependencies.
*/

// A notation of whether a dependency is requested directly
// by this manifest, or is a dependency of another dependency.
enum DependencyRelationship {
  direct = 'direct',
  indirect = 'indirect'
}

// A notation of whether the dependency is required for the primary
// build artifact (runtime), or is only used for development.
// Future versions of this specification may allow for more granular
// scopes, like `runtime:server`, `runtime:shipped`,
// `development:test`, `development:benchmark`.
enum DependencyScope {
  runtime = 'runtime',
  development = 'development'
}

export class Dependency {
  #name: string
  public package_url?: string
  public relationship?: DependencyRelationship
  public scope?: DependencyScope
  public dependencies?: string[]

  constructor(package_url: string, relationship?: string, scope?: string) {
    this.package_url = package_url
    this.#name = this.parseDependencyNameAndVersion(package_url)
    if (relationship !== undefined) {
      this.relationship = this.setRelationship(relationship)
    }
    if (scope !== undefined) {
      this.scope = this.setScope(scope)
    }
  }

  private setRelationship(relationship: string): DependencyRelationship {
    if (
      DependencyRelationship[
        relationship as keyof typeof DependencyRelationship
      ] !== undefined
    ) {
      return DependencyRelationship[
        relationship as keyof typeof DependencyRelationship
      ]
    } else {
      throw new Error(
        `Invalid dependency relationship: ${relationship}. Only 'direct' and 'indirect' are supported.`
      )
    }
  }

  private setScope(scope: string): DependencyScope {
    if (DependencyScope[scope as keyof typeof DependencyScope] !== undefined) {
      return DependencyScope[scope as keyof typeof DependencyScope]
    } else {
      throw new Error(
        `Invalid dependency scope: ${scope}. Only 'runtime' and 'development' are supported.`
      )
    }
  }

  private parseDependencyNameAndVersion(package_url: string): string {
    // Match the start of the package_url and the ecosystem name
    // Example: pkg:npm/%40angular/animation@12.3.1 matches pkg:npm/
    // Example: pkg:deb/debian/curl@7.50.3-1?arch=i386&distro=jessie matches pkg:deb/
    const matchFound = package_url.match(/pkg:(.*?)\//)
    if (matchFound && matchFound.index != null) {
      return package_url.split(matchFound[0])[1]
    } else {
      throw new Error(
        'Dependency name and version could not be processed from package url: ' +
          package_url
      )
    }
  }

  public getDependencyName(): string {
    return this.#name
  }

  addTransitiveDependency(dependency: Dependency) {
    if (this.dependencies === undefined) {
      this.dependencies = []
    }
    this.dependencies.push(dependency.getDependencyName())
  }
}

export type FileInfo = {
  source_location?: string // eslint-disable-line camelcase
}

type DependencyGraph = {
  [key: string]: Dependency
}

type Scalar = null | boolean | string | number

export const MaxMetaDataKeys = 8

export type Metadata = {
  [key: string]: Scalar
}

export function metadataValidSize(metadata: Metadata): boolean {
  if (
    Object.keys(metadata).length >= 1 &&
    Object.keys(metadata).length <= MaxMetaDataKeys
  ) {
    return true
  }
  return false
}

export class Manifest {
  public name: string
  public file?: FileInfo
  public metadata?: Metadata
  public resolved?: DependencyGraph

  constructor(name: string, file?: FileInfo, metadata?: Metadata) {
    this.name = name
    if (file) {
      this.file = file
    }
    if (metadata) {
      if (metadataValidSize(metadata)) {
        this.metadata = metadata
      } else {
        throw new Error(
          'Manifest metadata must contain no more than ' +
            MaxMetaDataKeys +
            ' keys'
        )
      }
    }
  }

  add(dependency: Dependency) {
    if (this.resolved === undefined) {
      this.resolved = {}
    }
    this.resolved[dependency.getDependencyName()] = dependency
  }
}

type Job = {
  correlator: string
  id: string
  html_url?: string // eslint-disable-line camelcase
}

export type Detector = {
  name: string
  url: string
  version: string
}

type Manifests = {
  [key: string]: Manifest
}

type ISO8601Date = string

export class Snapshot {
  public version: number
  public job: Job
  public sha: string // sha of the Git commit
  public ref: string // ref of the Git commit; example: "refs/heads/main"
  public scanned: ISO8601Date
  public detector?: Detector
  public metadata?: Metadata
  public manifests?: Manifests

  constructor(
    context: Context,
    options: { metadata?: Metadata; detector?: Detector } = {},
    version: 0 = 0
  ) {
    if (options.metadata !== undefined) {
      if (metadataValidSize(options.metadata)) {
        this.metadata = options.metadata
      } else {
        throw new Error(
          'Manifest metadata must contain no more than ' +
            MaxMetaDataKeys +
            ' keys'
        )
      }
    }
    if (options.detector !== undefined) {
      this.detector = options.detector
    }
    if (version) {
      this.version = version
    }
    this.version = version
    this.job = {
      correlator: context.job,
      id: context.runId.toString()
    }
    this.sha = context.sha
    this.ref = context.ref
    this.scanned = new Date().toISOString()
  }

  add(manifest: Manifest) {
    if (this.manifests === undefined) {
      this.manifests = {}
    }
    this.manifests[manifest.name] = manifest
  }

  view() {
    console.log('Snapshot:')
    console.log(JSON.stringify(this, undefined, 2))
  }

  async submit() {
    core.setOutput('snapshot', JSON.stringify(this, undefined, 2))
    core.notice('Submitting snapshot...')
    core.notice(JSON.stringify(this, undefined, 2))

    const context = github.context
    const repo = context.repo
    const githubToken = core.getInput('token')
    const octokit = new Octokit({
      auth: githubToken
    })

    try {
      const response = await octokit.request(
        'POST /repos/{owner}/{repo}/dependency-graph/snapshots',
        {
          headers: {
            accept: 'application/vnd.github.foo-bar-preview+json'
          },
          owner: repo.owner,
          repo: repo.repo,
          data: JSON.stringify(this, undefined, 2)
        }
      )
      core.notice(
        'Snapshot sucessfully created at ' + response.data.created_at.toString()
      )
    } catch (error) {
      if (error instanceof Error) {
        core.warning(error.message)
        if (error.stack) core.warning(error.stack)
      }
      throw new Error(`Failed to submit snapshot: ${error}`)
    }
  }
}
