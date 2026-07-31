import type { DiscoveryNode } from "./DiscoveryNode.js";
import type { DiscoverySource } from "./DiscoverySource.js";

export interface DiscoveryRootSpec {
  readonly source: DiscoverySource;
  readonly discovery: DiscoveryNode;
}

export class DiscoveryRoot {
  constructor(public readonly spec: DiscoveryRootSpec) {}

  get node() {
    return this.spec.discovery;
  }

  get source() {
    return this.spec.source;
  }
}
