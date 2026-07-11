import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type FsObject } from "../discovery/FsObject.js";
import { type ImportResult } from "./ImportResult.js";

export interface ImportNode {
  accepts(
    discovery: DiscoveryResult
  ): boolean;

  import(
    discovery: DiscoveryResult
  ): ImportResult[];

  //inferredPrefix(obj: FsObject): string;
}