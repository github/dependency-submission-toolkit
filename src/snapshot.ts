import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Context } from '@actions/github/lib/context.js'
import { RequestError } from '@octokit/request-error'
import type { PullRequestEvent } from '@octokit/webhooks-types'

import type { Manifest } from './manifest.js'

/*
Core functionality for creating a snapshot of a project's dependencies.
*/

/**
 * When multiple snapshots are submitted, Job provides the means for Snapshots to
 * be distinguished. Correlator must be unique between different Snapshots
 */
export type Job = {
  correlator: string
  id: string
  html_url?: string
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
 * shaFromContext returns the sha of the commit that triggered the action, or the head sha of the PR.
 *
 * See https://docs.github.com/en/actions/reference/events-that-trigger-workflows#pull_request for more details
 * about why this function is necessary, but the short reason is that GITHUB_SHA is _not_ necessarily the head sha
 * of the PR when the event is pull_request (or some other related event types).
 *
 * @param {Context} context
 * @returns {string}
 */
export function shaFromContext(context: Context): string {
  const pullRequestEvents = [
    'pull_request',
    'pull_request_comment',
    'pull_request_review',
    'pull_request_review_comment'
    // Note that pull_request_target is omitted here.
    // That event runs in the context of the base commit of the PR,
    // so the snapshot should not be associated with the head commit.
  ]
  if (pullRequestEvents.includes(context.eventName)) {
    const pr = (context.payload as PullRequestEvent).pull_request
    return pr.head.sha
  }
  return context.sha
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
 * Snapshot is the top-level container for Dependency Submission
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
  detector: Detector

  /**
   * All constructor parameters of a Snapshot are optional, but can be specified for specific overrides
   *
   * @param {Detector} detector
   * @param {Context} context
   * @param {Job} job
   * @param {Date} date
   * @param {number} version
   */
  constructor(
    detector: Detector,
    context: Context = github.context,
    job?: Job,
    date: Date = new Date(),
    version = 0
  ) {
    this.detector = detector
    this.version = version
    this.job = job || jobFromContext(context)
    this.sha = shaFromContext(context)
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
  const githubToken = core.getInput('token') || (await core.getIDToken())
  const octokit = github.getOctokit(githubToken)

  try {
    const response = await octokit.request(
      'POST /repos/{owner}/{repo}/dependency-graph/snapshots',
      {
        headers: {
          accept: 'application/vnd.github.foo-bar-preview+json'
        },
        owner: repo.owner,
        repo: repo.repo,
        ...snapshot
      }
    )
    const result = response.data.result
    if (result === 'SUCCESS' || result === 'ACCEPTED') {
      core.notice(
        `Snapshot successfully created at ${response.data.created_at.toString()}`
      )
    } else {
      core.error(
        `Snapshot creation failed with result: "${result}: ${response.data.message}"`
      )
    }
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
