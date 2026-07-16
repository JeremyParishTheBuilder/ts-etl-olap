import { type ColumnValue } from "../../types/ColumnValue.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type ImportRowIdentity } from "./ImportRowIdentity.js";
import { type ImportMapping } from "./ImportMapping.js";
import type { CaptureValue } from "../value/CaptureValue.js";

export class ImportResult {
  constructor(
    readonly mapping: ImportMapping,
    readonly discovery: DiscoveryResult,
    readonly captures: Map<string, CaptureValue>,
    readonly values: Map<string, ColumnValue>,
    readonly rowIdentity: ImportRowIdentity,
  ) {}
}