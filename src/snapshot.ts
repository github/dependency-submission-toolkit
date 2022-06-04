/* eslint-disable camelcase */
import { Context } from '@actions/github/lib/context'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'

import { Manifest } from './manifest'
import { Metadata } from './metadata'

/*
Core functionality for creating a snapshot of a project's dependencies.
*/

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

type Manifests = Record<string, Manifest>

type ISO8601Date = string

export class Snapshot {
  manifests: Manifests
  version: number
  job: Job
  sha: string // sha of the Git commit
  ref: string // ref of the Git commit; example: "refs/heads/main"
  scanned: ISO8601Date
  detector?: Detector
  metadata?: Metadata

  constructor(
    context: Context,
    detector?: Detector,
    metadata?: Metadata,
    version: 0 = 0
  ) {
    this.detector = detector
    this.metadata = metadata
    this.version = version
    this.version = version
    this.job = {
      correlator: context.job,
      id: context.runId.toString()
    }
    this.sha = context.sha
    this.ref = context.ref
    this.scanned = new Date().toISOString()
    this.manifests = {}
  }

  add(manifest: Manifest) {
    this.manifests[manifest.name] = manifest
  }

  prettyJSON(): string {
    return JSON.stringify(this, undefined, 4)
  }

  toJSON(): string {
    return JSON.stringify(this)
  }

  async submit() {
    core.setOutput('snapshot', this.toJSON())
    core.notice('Submitting snapshot...')
    core.notice(this.prettyJSON())

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
