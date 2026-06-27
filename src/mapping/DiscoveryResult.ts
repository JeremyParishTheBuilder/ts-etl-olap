import { type FsObject } from "./FsObject.js";

export class DiscoveryResult {

  constructor(
    readonly nodeType: string,
    readonly captures: Map<string, unknown>,
    readonly objects: Map<string, FsObject>
  ) {}

}