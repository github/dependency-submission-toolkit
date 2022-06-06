import { PackageURL } from 'packageurl-js'
import { Package } from './package'
import { Graph } from './graph'
import { Manifest } from './manifest'
import { Metadata } from './metadata'

export class UsageInformation {
  public constructor(init?:Partial<UsageInformation>) {
    Object.assign(this, init);
  }

  public isDevDependency: boolean = false
  public isDirectDependency: boolean = false
  public parentIdentifier: PackageURL | string | null = null
}

/**
 * Use recorder to record all dependency usages
 */
export class Recorder {
  private recorders: { [manifestName: string]: ManifestRecorder } = {}

  public createOrGetManifestRecorder(name: string, filePath: string | undefined, metadata: Metadata): ManifestRecorder {
    let recorder = this.recorders[name]
    if (!recorder) {
      let graph = new Graph()
      recorder = new ManifestRecorder(name, filePath, metadata, graph)
      this.recorders[name] = recorder
    }

    return recorder
  }

  public manifests(): { [manifestName: string]: Manifest } {
    let mappedEntries = Object.values(this.recorders)
      .map(manifestRecorder => {
        let manifest = manifestRecorder.manifest
        return [manifestRecorder.name, manifest]
      })
    return Object.fromEntries(mappedEntries)
  }

  /**
   * We apply usage information to a given package, which is a way for us to add graph relationships and then aggregate details which may later be converted / calculated.
   */
}

export class ManifestRecorder {
  readonly name : string
  readonly filePath : string | undefined
  readonly metadata: Metadata
  readonly graph : Graph

  constructor(name: string, filePath: string | undefined, metadata: Metadata, graph: Graph) {
    this.name = name
    this.filePath = filePath
    this.metadata = metadata
    this.graph = graph
  }

  public registerUsage(identifier: PackageURL | string, usageInformation: UsageInformation = new UsageInformation()): Package {
    const dep = this.graph.package(identifier)
    this.applyUsageInformation(this.graph, dep, usageInformation)
    return dep
  }

  public manifest(): Manifest {
    let manifest = new Manifest(this.name, this.filePath, this.metadata)
    this.graph.packages().forEach(p => {
      if (p.isDirectDependency()) {
        manifest.addDirectDependency(p, p.isDevDependency() ? 'development' : 'runtime')
      } else {
        manifest.addIndirectDependency(p, p.isDevDependency() ? 'development' : 'runtime')
      }
    })

    return manifest
  }

  private applyUsageInformation(graph: Graph, dep: Package, usageInformation: UsageInformation) {
    if (usageInformation.parentIdentifier != null) {
      let parentPackage = graph.package(usageInformation.parentIdentifier)
      parentPackage.addTransitive(dep)
    }

    dep.addUsageInformation(usageInformation);
  }
}


