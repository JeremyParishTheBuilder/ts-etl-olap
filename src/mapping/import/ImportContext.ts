import type { CaptureContext } from "../discovery/CaptureContext.js";
import type { DiscoveryResult } from "../discovery/DiscoveryResult.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import { type ImportRowIdentity } from "./ImportRowIdentity.js";

export class ImportContext implements CaptureContext {
  constructor(
    readonly discovery: DiscoveryResult,
    readonly identity: ImportRowIdentity,
    readonly source: CaptureValue,
    readonly tableName?: string,
  ) {}

  get captures() {
    return this.discovery.captures;
  }

  withIdentity(identity: ImportRowIdentity): ImportContext {
    return new ImportContext(
      this.discovery,
      identity,
      this.source,
      this.tableName,
    );
  }

  withSource(source: CaptureValue): ImportContext {
    return new ImportContext(
      this.discovery,
      this.identity,
      source,
      this.tableName,
    );
  }

  withDiscovery(discovery: DiscoveryResult): ImportContext {
    return new ImportContext(
      discovery,
      this.identity,
      discovery.value,
      this.tableName,
    );
  }

  withTable(tableName: string): ImportContext {
    return new ImportContext(
      this.discovery,
      this.identity,
      this.source,
      tableName,
    );
  }
}
