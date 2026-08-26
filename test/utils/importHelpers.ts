import { DiscoveryIdentity } from "../../src/mapping/discovery/DiscoveryIdentity.ts";
import { DiscoveryResult } from "../../src/mapping/discovery/DiscoveryResult.ts";
import { ImportContext } from "../../src/mapping/import/ImportContext.ts";
import { ImportRowIdentity } from "../../src/mapping/import/ImportRowIdentity.ts";
import type { CaptureValue } from "../../src/mapping/value/CaptureValue.ts";

export function createImportContext(
  source: CaptureValue
): ImportContext {
  const discovery = new DiscoveryResult(
    "test",
    new DiscoveryIdentity([]),
    source,
    new Map(),
  );

  return new ImportContext(
    discovery,
    ImportRowIdentity.empty(),
    source,
  );
}