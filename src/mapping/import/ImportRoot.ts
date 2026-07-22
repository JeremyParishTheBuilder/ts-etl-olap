import type { DiscoveryNode } from "../discovery/DiscoveryNode.js";
import type { ImportMapping } from "./ImportMapping.js";

export interface ImportRootSpec {
  //readonly discovery: string;
  readonly discovery: DiscoveryNode;
  readonly mapping: ImportMapping;
}

export class ImportRoot {

  //public discovery: string;
  public discovery: DiscoveryNode;
  public mapping: ImportMapping;

  constructor(
    readonly spec: ImportRootSpec
  ) {
    this.discovery = spec.discovery;
    this.mapping = spec.mapping;
  }

}