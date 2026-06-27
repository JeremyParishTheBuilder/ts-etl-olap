import { type DiscoveryResult } from "./DiscoveryResult.js";

export class ImportResult {
  constructor(
    readonly discovery: DiscoveryResult,
    readonly tableName: string,
    readonly values: Map<string, unknown>
  ) {}
}