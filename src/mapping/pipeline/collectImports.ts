import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type ImportNode } from "../import/ImportNode.js";
import { type ImportResult } from "../import/ImportResult.js";

export function collectImports(
  discoveries: readonly DiscoveryResult[],
  importers: readonly ImportNode[]
): ImportResult[] {
  const results: ImportResult[] = [];

  for (const discovery of discoveries) {
    for (const importer of importers) {

      if (!importer.accepts(discovery)) {
        continue;
      }

      results.push(
        ...importer.import(discovery)
      );
    }
  }

  return results;
}