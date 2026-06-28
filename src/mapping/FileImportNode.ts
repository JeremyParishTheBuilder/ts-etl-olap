import { Directory } from "./Directory.js";
import { File } from "./File.js";
import { type DiscoveryResult } from "./DiscoveryResult.js";
import { type FsObjectMatcher } from "./FsObjectMatcher.js";
import { type ImportMapping } from "./ImportMapping.js";
import { type ImportNode } from "./ImportNode.js";
import { ImportResult } from "./ImportResult.js";
import { type FileReader } from "./FileReader.js";
import { ImportContext } from "./ImportContext.js";

export class FileImportNode implements ImportNode {
  constructor(
    readonly discoveryNodeType: string,
    readonly matcher: FsObjectMatcher,
    readonly reader: FileReader<Record<string, unknown>>,
    readonly mapping: ImportMapping,
    readonly directoryObjectName: string
  ) {}

  accepts(
    discovery: DiscoveryResult
  ): boolean {
    return (
      discovery.nodeType ===
      this.discoveryNodeType
    );
  }

  import(
    discovery: DiscoveryResult
  ): ImportResult[] {

    const directory = discovery.objects.get(this.directoryObjectName);

    if (!(directory instanceof Directory)) {
      return [];
    }

    const file =
      directory.contents?.find(
        obj =>
          obj instanceof File &&
          this.matcher.matches(obj)
      );

    if (!(file instanceof File)) {
      return [];
    }

    const source = this.reader.read(file);

    if (source === null) {
      return [];
    }

    const context = new ImportContext(discovery.captures);

    return this.importMapping(
      discovery,
      context,
      this.mapping,
      source
    );
  }

  private importMapping(
    discovery: DiscoveryResult,
    context: ImportContext,
    mapping: ImportMapping,
    source: unknown
  ): ImportResult[] {
    const results: ImportResult[] = [];

    const values = new Map<string, unknown>();

    const excludedProperties = new Set(
      mapping.nestedMappings.flatMap(m => m.sourceResolver.consumedKeys())
    );

    if (
      source &&
      typeof source === "object" &&
      !Array.isArray(source)
    ) {
      for (const [key,value] of Object.entries(source)) {
        if (excludedProperties.has(key)) {
          continue;
        }
        
        values.set(
          mapping.prefix + key,
          value
        );
      }
    }

    for (const field of mapping.derivedFields) {
      values.set(
        field.columnName,
        field.sourceResolver.resolve(source)
      );
    }

    results.push(
      new ImportResult(
        discovery,
        context.captures,
        mapping.tableName,
        values
      )
    );

    let childContext = context;

    for (const capture of mapping.captures) {
      childContext = childContext.withCapture(
        capture.columnName,
        capture.sourceResolver.resolve(source)
        //capture.sourceResolver.resolveFirst(source)
      );
    }

    for (const child of mapping.nestedMappings) {
      const nestedSources = child.sourceResolver.resolveMany(source);

      for (const nested of nestedSources) {
        results.push(
          ...this.importMapping(
            discovery,
            childContext,
            child,
            nested
          )
        );
      }
    }

    return results;
  }
}