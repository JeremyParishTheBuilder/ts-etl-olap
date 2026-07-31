import { type Databases } from "../../relational/Databases.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type DatabaseSchema } from "../schema/DatabaseSchema.js";
import { type ImportResult } from "../import/ImportResult.js";

export interface ImportPipelineResult {
  readonly discoveries: readonly DiscoveryResult[];
  readonly imports: readonly ImportResult[];
  readonly schema: DatabaseSchema;
  readonly databases: Databases;
}
