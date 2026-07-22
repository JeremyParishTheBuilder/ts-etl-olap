import { type Directory } from "../discovery/Directory.js";
import { type Databases } from "../../schema/Databases.js";
import { DatabaseBuilder } from "../schema/DatabaseBuilder.js";
import { DiscoveryContext } from "../discovery/DiscoveryContext.js";
import { type DiscoveryNode } from "../discovery/DiscoveryNode.js";
import { collectImports } from "./collectImports.js";
import { inferSchema } from "./inferSchema.js";
import { ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type ImportPipelineResult } from "./ImportPipelineResult.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import type { ImportMapping } from "../import/ImportMapping.js";
import type { ImportRoot } from "../import/ImportRoot.js";
import { ObjectImporter } from "../import/ObjectImporter.js";
import type { ImportResult } from "../import/ImportResult.js";
import type { DiscoveryResult } from "../discovery/DiscoveryResult.js";

export interface ImportPipelineSpec {
  //readonly registry: DiscoveryNode;
  readonly importRoots: readonly ImportRoot[];
  readonly databaseName: string;
  readonly root: Directory;
  readonly existingDatabases: Databases;
  readonly sourceIdentity?: ColumnValue;
}

export class ImportPipeline {
  static build
  (
    spec: ImportPipelineSpec
  ): ImportPipelineResult {

    const importResults: ImportResult[] = [];

    const objectImporter = new ObjectImporter();

    let discoveryResults: DiscoveryResult[];

    for (const importRoot of spec.importRoots) {

      const nodeType = importRoot.spec.discovery.spec.nodeType;

      discoveryResults = importRoot.discovery.discover(
        new DiscoveryContext(
          spec.root,
          new Map(),
          ImportRowIdentity.from([
            spec.sourceIdentity ??
            spec.root.basename
          ])
        )
      );

      console.log("discoveryResults.length:");
      console.log(discoveryResults.length);

      const discoveryRoot = discoveryResults.find(
        dr =>
          dr.resultType === nodeType
      );

      if (!discoveryRoot) {
        throw new Error(`No discovery result matching node type: ${nodeType}`);
      }

      importResults.push(
        ...objectImporter.import(discoveryRoot, importRoot.mapping)
      );

    }

    const schema = inferSchema(importResults);

    const databases = new DatabaseBuilder(
      spec.databaseName,
      schema,
      importResults
    ).build(spec.existingDatabases);

    return {
      discoveries: discoveryResults!,
      schema,
      imports: importResults,
      databases,
    }
  }
}