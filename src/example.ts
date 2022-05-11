import { run } from './index'
import { parseDependents } from './go_mod_parse_dependents'

// Provide the implemented ProcessDependenciesContent and either the manifestPath or manifestCommand
const metadata = {
  foo: 1.0,
  bar: false,
  baz: 'somethingsomething',
  nullz: null
}
const detector = {
  name: 'Typescript Snapshot Detector',
  url: 'https://github.com/github/dependency-snapshot-action',
  version: '0.0.1'
}

run(
  parseDependents,
  { command: 'go mod graph' },
  { metadata: metadata, detector: detector }
)
