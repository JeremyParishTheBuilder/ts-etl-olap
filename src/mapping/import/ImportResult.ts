import { type ColumnValue } from "../../types/ColumnValue.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type ImportRowIdentity } from "./ImportRowIdentity.js";
import { type ImportMapping } from "./ImportMapping.js";

export class ImportResult {
  constructor(
    readonly tableName: string,
    readonly rowIdentity: ImportRowIdentity,
    readonly values: Map<string, ColumnValue>,
  ) {}
}