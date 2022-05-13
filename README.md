# Dependency Submission Toolkit

A TypeScript library for creating dependency snapshots and submitting them to the dependency submission API. Snapshots are a set of dependencies grouped by manifest with some related metadata. After submission to the API, the included dependencies appear in the repository's [dependency graph](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph).  

## Usage

Some useful commands to navigate using the library: 

- `npm run build` to generate the JavaScript files
- `npm run package` to compile the code into a single file
- `npm run all` will do the above and additional commands (e.g. lint the code, test)
- `npm publish` will create the JavaScript files before publishing the code

### Writing Your Own Snapshot Action

To use the library to create and submit a snapshot for your packaging ecosystem, you'll need to:

1. Write a `ProcessDependenciesContent` function that: 
    - Uses the provided `readDependencies` to get the text data from a specified manifest path or with a specified manifest command (e.g. in Go you may use `go mod graph`)
    - Take that text data and translate it into a `ParsedDependencies` map of the dependency package URL to the `Entry` object with the package name, version, package_url and any dependencies specified. The [package_url specification](https://github.com/package-url/purl-spec) has details on formatting (e.g. for npm, if the dependency is tunnel and version 0.0.1 the package_url is `pkg:npm/tunnel@0.0.1`)
2. Use the `run` function and provide the following below to create and submit a snapshot:
    - Your implemented `ProcessDependenciesContent`
    - The `manifestInfo` - either a manifest path (e.g. `src/package.json`) in the repository or a command line command to obtain the data (e.g. in Go you may use `go mod graph`)
    - `options` data: `Detector` data that includes the detector name, url, and version; `Metadata` data of max eight pieces of information of type null, boolean, string, number. You can find these definitions in the [`snapshot.ts`](https://github.com/github/dependency-submission-toolkit/blob/main/src/snapshot.ts) file.

There is a provided [`src/example.ts`](https://github.com/github/dependency-submission-toolkit/blob/main/src/example.ts) file which demonstrates how to use the library, as it is detailed above.

## Testing

This library uses the `jest` testing framework with tests located in the `/test` directory. To run the tests, you can use `npm test` to execute the test script. Otherwise you can use `jest` directly.

## Installation

The `dependency-submission-toolkit` library is hosted on GitHub's npm registry. Follow [the documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package) to install the package in your project.
