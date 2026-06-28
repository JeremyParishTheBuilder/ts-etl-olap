import { type DiscoveryResult } from "./DiscoveryResult.js";
import { type ImportResult } from "./ImportResult.js";

export interface ImportNode {

  accepts(
    discovery: DiscoveryResult
  ): boolean;

  import(
    discovery: DiscoveryResult
  ): ImportResult[];

}