/* eslint-disable camelcase */

/*
 * Constructs for processing manifest entries into Entry objects that can be used to populate a Snapshot with Dependency objects.
 */

import {warning} from '@actions/core'
import * as exec from '@actions/exec'
import {readFile} from 'fs'

export class Entry {
  public name: string
  public version: string
  public package_url: string
  public relationship?: string
  public scope?: string
  public dependencies?: Entry[]

  public constructor(package_url: string, relationship?: string, scope?: string, dependencies?: Entry[]) {
    const parsedEntryText = this.parseData(package_url)
    this.package_url = package_url
    this.name = parsedEntryText[0]
    this.version = parsedEntryText[1]
    if (relationship !== undefined) {
      this.relationship = relationship
    }
    if (scope !== undefined) {
      this.scope = scope
    }
    if (this.dependencies !== undefined) {
      this.dependencies = dependencies
    } else {
      this.dependencies = []
    }
  }

  private parseData(entryText: string) {
    const matchFound = entryText.match(/(?<!^@)(?<=@)[^\]]+/)
    if (matchFound && matchFound.index != null) {
      return [entryText.slice(0, matchFound.index - 1), matchFound[0]]
    } else {
      throw new Error(`Dependency entry name and version could not be processed: ${entryText}`)
    }
  }

  public addDependency(dependency: Entry) {
    if (this.dependencies === undefined) {
      this.dependencies = []
    }
    if (this.dependencies.indexOf(dependency) === -1) {
      this.dependencies.push(dependency)
    }
  }
}

export type ParsedDependencies = {
  [key: string]: Entry
}

export interface ProcessDependenciesContent {
  (contents: string): ParsedDependencies
}

export interface ManifestCommand {
  command: string
  workingDirs: string[]
}

async function execCmd(command: string, cwd: string): Promise<string> {
  const cur_dir = process.cwd()
  process.chdir(cwd)

  let output = ''
  let std_err = ''

  const options: exec.ExecOptions = {}
  options.listeners = {
    stdout: (data: Buffer) => {
      output += data.toString()
    },
    stderr: (data: Buffer) => {
      std_err += data.toString()
    }
  }

  return exec.exec(command, undefined, options).then(_ => {
    if (std_err) {
      console.log(std_err)
    }

    process.chdir(cur_dir)
    return output
  })
}

async function runCommand(command: string | ManifestCommand): Promise<string[]> {
  if (typeof command === 'string') {
    return [await execCmd(command, process.cwd())]
  } else {
    return command.workingDirs.map(dir => {
      await execCmd(command.command, dir)
    })
  }
}

export async function readDependencies(
  dependenciesProcessorFunc: ProcessDependenciesContent,
  manifestInfo: {path?: string; command?: string | ManifestCommand} = {}
): Promise<ParsedDependencies | undefined> {
  try {
    if (manifestInfo.path !== undefined) {
      return new Promise<string>((resolve, reject) => {
        readFile(manifestInfo.path!, {}, (err, data) => {
          if (err) reject(err)
          resolve(data.toString())
        })
      }).then(contents => {
        return dependenciesProcessorFunc(contents)
      })
    }

    if (manifestInfo.command !== undefined) {
      return dependenciesProcessorFunc(await runCommand(manifestInfo.command))
    }
  } catch (error) {
    if (error instanceof Error) {
      warning(error.message)
      if (error.stack) warning(error.stack)
    }
    throw new Error('Could not parse project dependencies.')
  }
}
