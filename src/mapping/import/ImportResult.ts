import { type ColumnValue } from "../../types/ColumnValue.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type ImportRowIdentity } from "./ImportRowIdentity.js";
import { type ImportMapping } from "./ImportMapping.js";

export class ImportResult {
  constructor(
    readonly mapping: ImportMapping,
    readonly discovery: DiscoveryResult,
    readonly captures: Map<string, ColumnValue>,
    readonly values: Map<string, ColumnValue>,
    readonly rowIdentity: ImportRowIdentity,
  ) {}
}