import type { DiscoveryResult } from "../discovery/DiscoveryResult.js";
import type { ImportContext } from "./ImportContext.js";
import type { ImportMapping } from "./ImportMapping.js";
import type { ImportRowIdentity } from "./ImportRowIdentity.js";

export interface ImportIdentityStrategy {
  createIdentity(
    discovery: DiscoveryResult,
    mapping: ImportMapping,
    context: ImportContext
  ): ImportRowIdentity;
}