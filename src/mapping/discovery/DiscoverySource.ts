import type { DiscoveryValue } from "../value/DiscoveryValue.js";
import type { FsObject } from "./FsObject.js";

export interface DiscoverySource {
  open(): DiscoveryValue;
}

export class FsDiscoverySource implements DiscoverySource {
  constructor(public readonly root: FsObject) {}

  open() {
    return this.root;
  }
}
