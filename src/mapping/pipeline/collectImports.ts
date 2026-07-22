import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import type { ImportMapping } from "../import/ImportMapping.js";
import { type ImportResult } from "../import/ImportResult.js";
import { ObjectImporter } from "../import/ObjectImporter.js";

export function collectImports(
  discoveries: readonly DiscoveryResult[],
  importMappings: readonly ImportMapping[]
): ImportResult[] {
  const results: ImportResult[] = [];

  const objectImporter = new ObjectImporter();

  for (const root of discoveries) {
    for (const importMapping of importMappings) {

      // const discovery = discoveries.find(
      //   d => d.resultType === importMapping.accepts
      // );

      // if (!discovery) {
      //   continue;
      // }

      console.log("collectImports(): This is the importMapping:");
      console.log(importMapping);
      console.log("collectImports(): This is the discovery:");
      console.log(root);
      // if (
      //   importMapping.accepts !== undefined &&
      //   importMapping.accepts !== discovery.resultType
      // ) {
      //   continue;
      // }

      console.log("-----------------------------------------");
      

      results.push(...objectImporter.import(root, importMapping));
    }
  }

  return results;
}