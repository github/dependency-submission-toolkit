import { Context } from '@actions/github/lib/context'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'
import { RequestError } from '@octokit/request-error'

import { Manifest } from './manifest'
import { Metadata } from './metadata'

/*
Core functionality for creating a snapshot of a project's dependencies.
*/

/**
 * When multiple snapshots are submit, Job provides the means for Snapshots to
 * be distinguished. Correlator and ID must be unique between different Snapshots
 */
export type Job = {
  correlator: string
  id: string | number
  html_url?: string // eslint-disable-line camelcase
}

/**
 * jobFromContext creates a job from a @actions/github Context
 *
 * @param {Context} context
 * @returns {Job}
 */
export function jobFromContext(context: Context): Job {
  return {
    correlator: context.job,
    id: context.runId.toString()
  }
}

/**
 * Detector provides metadata details about the detector used to generate the snapshot
 */
export type Detector = {
  name: string
  url: string
  version: string
}

/**
 * Manifests.
 */
type Manifests = Record<string, Manifest>

/**
 * ISO8601Date.
 */
type ISO8601Date = string

/**
 * Snapshot is the top-level container for Dependency Submisison
 */
export class Snapshot {
  /**
   * @type {Manifests}
   */
  manifests: Manifests
  /**
   * @type {number}
   */
  version: number
  /**
   * @type {Job}
   */
  job: Job
  /**
   * @type {string}  sha of the Git commit
   */
  sha: string
  /**
   * @type {string}  ref of the Git commit; example: "refs/heads/main"
   */
  ref: string
  /**
   * @type {ISO8601Date}
   */
  scanned: ISO8601Date
  /**
   * @type {Detector}
   */
  detector?: Detector
  /**
   * @type {Metadata}
   */
  metadata?: Metadata

  /**
   * All construor parameters of a Snapshot are optional, but can be specified for specific overrides
   *
   * @param {Context} context
   * @param {Job} job
   * @param {Detector} detector
   * @param {Metadata} metadata
   * @param {Date} date
   * @param {number} version
   */
  constructor(
    context: Context = github.context,
    job?: Job,
    detector?: Detector,
    metadata?: Metadata,
    date: Date = new Date(),
    version: number = 0
  ) {
    this.detector = detector
    this.metadata = metadata
    this.version = version
    this.job = job || jobFromContext(context)
    this.sha = context.sha
    this.ref = context.ref
    this.scanned = date.toISOString()
    this.manifests = {}
  }

  /**
   * addManifest adds a manifest to the snapshot. At least one manifest must be added.
   *
   * @param {Manifest} manifest
   */
  addManifest(manifest: Manifest) {
    this.manifests[manifest.name] = manifest
  }

  /**
   * prettyJSON formats an intended version of the Snapshot (useful for debugging)
   *
   * @returns {string}
   */
  prettyJSON(): string {
    return JSON.stringify(this, undefined, 4)
  }
}

/**
 * submitSnapshot submits a snapshot to the Dependency Submission API
 *
 * @param {Snapshot} snapshot
 * @param {Context} context
 */
export async function submitSnapshot(
  snapshot: Snapshot,
  context: Context = github.context
) {
  core.setOutput('snapshot', JSON.stringify(snapshot))
  core.notice('Submitting snapshot...')
  core.notice(snapshot.prettyJSON())

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
        data: JSON.stringify(snapshot)
      }
    )
    core.notice(
      'Snapshot sucessfully created at ' + response.data.created_at.toString()
    )
  } catch (error) {
    if (error instanceof RequestError) {
      core.error(
        `HTTP Status ${error.status} for request ${error.request.method} ${error.request.url}`
      )
      if (error.response) {
        core.error(
          `Response body:\n${JSON.stringify(error.response.data, undefined, 2)}`
        )
      }
    }
    if (error instanceof Error) {
      core.error(error.message)
      if (error.stack) core.error(error.stack)
    }
    throw new Error(`Failed to submit snapshot: ${error}`)
  }
}
