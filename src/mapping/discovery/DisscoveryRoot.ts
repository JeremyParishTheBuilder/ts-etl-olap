import type { DiscoveryNode } from "../discovery/DiscoveryNode.js";
import type { DiscoverySource } from "./DiscoverySource.ts";

export interface DiscoveryRootSpec {
  readonly source: DiscoverySource;
  readonly discovery: DiscoveryNode;
}

export class DiscoveryRoot {
  constructor(
    public readonly spec: DiscoveryRootSpec
  ) {}

  get node() {
    return this.spec.discovery;
  }

  get source() {
    return this.spec.source;
  }
}