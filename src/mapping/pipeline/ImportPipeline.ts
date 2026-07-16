import { type Directory } from "../discovery/Directory.js";
import { type Databases } from "../../schema/Databases.js";
import { DatabaseBuilder } from "../schema/DatabaseBuilder.js";
import { DiscoveryContext } from "../discovery/DiscoveryContext.js";
import { type DiscoveryNode } from "../discovery/DiscoveryNode.js";
import { type ImportNode } from "../import/ImportNode.js";
import { collectImports } from "./collectImports.js";
import { inferSchema } from "./inferSchema.js";
import { ImportRowIdentity } from "../import/ImportRowIdentity.js";
import { type ImportPipelineResult } from "./ImportPipelineResult.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import type { DiscoveryValue } from "../value/DiscoveryValue.js";

export interface ImportPipelineSpec//<
  //TCurrent extends DiscoveryValue,
  //TNext extends DiscoveryValue
//> {
{
  readonly registry: DiscoveryNode;//<TCurrent, TNext>;
  readonly importers: readonly ImportNode[];
  readonly databaseName: string;
  readonly root: Directory;
  readonly existingDatabases: Databases;
  readonly sourceIdentity?: ColumnValue;
}

export class ImportPipeline<TCurrent extends DiscoveryValue, TNext extends DiscoveryValue> {
  static build//<
    //TCurrent extends DiscoveryValue,
    //TNext extends DiscoveryValue
  //>(
  (
    spec: ImportPipelineSpec//<TCurrent, TNext>
  ): ImportPipelineResult {
    const discoveries = spec.registry.discover(
      new DiscoveryContext(
        spec.root,
        new Map(),
        ImportRowIdentity.from([
          spec.sourceIdentity ??
          spec.root.basename
        ])
      )
    );

    const imports = collectImports(
      discoveries,
      spec.importers
    );

    for (const i of imports) {
      console.log(i);
    }

    const schema = inferSchema(imports);

    const databases = new DatabaseBuilder(
      spec.databaseName,
      schema,
      imports
    ).build(spec.existingDatabases);

    return {
      discoveries,
      schema,
      imports,
      databases,
    }
  }
}