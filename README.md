# Dependency Submission Toolkit

`@github/dependency-submission-toolkit` is a TypeScript library for
creating dependency snapshots and submitting them to the dependency
submission API. Snapshots are a set of dependencies grouped by manifest with
some related metadata. A manifest can be a physical file or a more abstract
representation of a dependency grouping (such the processing of program
outputs). After submission to the API, the included dependencies appear in the
repository's [dependency
graph](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph).

## Installation

```
npm install @github/dependency-submission-toolkit
```

## Usage

Some useful commands to navigate using the library:

- `npm run build` to compile TypeScript source
- `npm run test` to run the tests
    - `npm run test:watch` to run the tests in watch-mode (tests re-run
    when files change)
- `npm run format` to format files using prettier
- `npm run lint` to lint files using ESLint
- `npm run package` to compile the code into a single file using `ncc`
- `npm run all` will do the above and additional commands (e.g. lint the code, test)

## Writing Your Own Dependency Submission Action

You may use classes from `@github/dependency-submission-toolkit` to help
in building your own GitHub Action for submitting dependencies to the
Dependency Submission API. At a high level, the steps to use the classes
are:

1. Create a `PackageCache` of all of the packages that could be included in your
   manifest, as well define as the relationships between them.

2. Using the packages defined in `PackageCache`, create a `Manifest` or
   a `BuildTarget`, which defines the dependencies of build environment or
   specific build artifact.

3. Create a `Snapshot` to include one or more `Manifests` or
   `BuildTargets`. The snapshot is the base container for submitting
   dependencies to the Dependency Submission API.

4. Follow the instructions for [Creating a JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action). These include:

    - Defining an `action.yml` action metadata file
    - Compiling the JavaScript into a single script using `ncc`
    - Testing your action in a workflow

A full example action using this library is included in th `example/`
directory. This example uses the output from `npm list` to create an accurate
and complete graph of the dependencies used in this library. This action is
also included in a workflow in this repository and run for each commit to the
`main` branch.


## Testing

This library uses the `jest` testing framework with tests co-located with
source files. To run the tests, you can use `npm test` to run tests.
Otherwise you can use `jest` directly.
