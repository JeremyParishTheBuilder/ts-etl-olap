import { type DiscoveryContext } from "./DiscoveryContext.js";
import { type DiscoveryResult } from "./DiscoveryResult.js";

export interface DiscoveryNode {
  discover(
    context: DiscoveryContext
  ): DiscoveryResult[];
}