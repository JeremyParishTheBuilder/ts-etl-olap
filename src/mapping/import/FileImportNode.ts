import { Directory } from "../discovery/Directory.js";
import { File } from "../discovery/File.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { ImportMapping } from "./ImportMapping.js";
import { type ImportNode } from "./ImportNode.js";
import { ImportResult } from "./ImportResult.js";
import { type FileReader } from "../discovery/FileReader.js";
import { ImportContext } from "./ImportContext.js";
import { isColumnValue, type ColumnValue } from "../../types/ColumnValue.js";
import { type JsonValue } from "../value/JsonValue.js";
import { type ValueResolverContext } from "../value/ValueResolverContext.js";
import { type ImportSource } from "./ImportSource.js";
import { type ArrayLocation } from "./ArrayLocation.js";
import { arraysEqual } from "../../utils/arrayHelpers.js";
import { pathToPascalCase, toPascalCase } from "../../utils/format.js";
import { PredicateBuilder } from "../../dsl/predicate/PredicateBuilder.js";
import { FsObject } from "../discovery/FsObject.js";

export interface FileImportNodeSpec {
  readonly acceptsNodeType: string;
  readonly matcher: PredicateBuilder<FsObject>;
  readonly reader: FileReader<JsonValue>;
  readonly mapping: ImportMapping;
  readonly directoryObjectName: string;
}

export class FileImportNode implements ImportNode {
  constructor(readonly spec: FileImportNodeSpec) {}

  accepts(
    discovery: DiscoveryResult
  ): boolean {
    return (
      discovery.resultType ===
      this.spec.acceptsNodeType
    );
  }

  import(
    discovery: DiscoveryResult
  ): ImportResult[] {

    const directory = discovery.objects.get(this.spec.directoryObjectName);

    if (!(directory instanceof Directory)) {
      return [];
    }

    const file =
      directory.contents?.find(
        obj =>
          obj instanceof File &&
          this.spec.matcher.evaluate(obj)
      );

    if (!(file instanceof File)) {
      return [];
    }

    const source = this.spec.reader.read(file);

    if (source === null) {
      return [];
    }

    const context = new ImportContext(
      discovery.captures,
      discovery.identity
    );

    return this.importMapping(
      discovery,
      context,
      this.spec.mapping,
      source,
      inferredPrefix(file)
    );
  }

  private importMapping(
    discovery: DiscoveryResult,
    context: ImportContext,
    mapping: ImportMapping,
    source: JsonValue,
    prefix: string,
  ): ImportResult[] {
    const results: ImportResult[] = [];

    const values = new Map<string, ColumnValue>();

    const excludedProperties = new Set(
      mapping.nestedMappings.flatMap(m => m.sourceResolver.consumedKeys())
    );

    const effectivePrefix = mapping.prefix ?? prefix;

    this.collectValues(
      values,
      effectivePrefix,
      source,
      excludedProperties,
    );

    let childContext = context;

    let resolverContext: ValueResolverContext = {
      source,
      captures: childContext.captures,
      capture(name: string): ColumnValue {
        const value = childContext.captures.get(name);

        if (value === undefined) {
          throw new Error(`Missing capture '${name}'.`);
        }

        return value;
      }
    };

    for (const [name, builder] of Object.entries(mapping.fields ?? {})) {
      values.set(
        effectivePrefix + name,
        builder.evaluate(resolverContext)
      );
    }

    for (const [name, builder] of Object.entries(mapping.captures?? {})) {
      childContext = childContext.withCapture(
        name,
        builder.evaluate(resolverContext)
      );
    }

    let rowIdentity = context.identity.append(
      ...mapping.sourceResolver.identityParts()
    );

    childContext = childContext.withIdentity(rowIdentity);

    results.push(
      new ImportResult(
        mapping,
        discovery,
        childContext.captures,
        values,
        rowIdentity
      )
    );

    for (const child of this.resolveNestedMappings(mapping, source)) {
      const nestedSources = child.sourceResolver.resolveMany(source);

      const childPrefix =
        (mapping.prefix ?? prefix)
        + pathToPascalCase(
            child.sourceResolver.identityParts()
        )
        + ".";

      for (const [index, nested] of nestedSources.entries()) {
        const nestedIdentity = rowIdentity.append(index);

        const context = childContext.withIdentity(nestedIdentity);

        results.push(
          ...this.importMapping(
            discovery,
            context,
            child,
            nested,
            childPrefix
          )
        );
      }
    }

    return results;
  }

  private flattenObject(
    values: Map<string, ColumnValue>,
    prefix: string,
    value: JsonValue,
    excludedTopLevelKeys: ReadonlySet<string>,
    path: readonly string[] = [],
  ): void {

    if (isColumnValue(value)) {
      values.set(
        prefix + path.join("."),
        value
      );
      return;
    }

    if (Array.isArray(value)) {
      return;
    }

    if (
      value !== null &&
      typeof value === "object"
    ) {
      for (const [key, child] of Object.entries(value)) {
        if (
          path.length === 0 &&
          excludedTopLevelKeys.has(key)
        ) {
          continue;
        }

        this.flattenObject(
          values,
          prefix,
          child,
          excludedTopLevelKeys,
          [...path, key],
        );
      }
    }
  }

  private collectValues(
    values: Map<string, ColumnValue>,
    prefix: string,
    value: JsonValue,
    excludedTopLevelKeys: ReadonlySet<string>,
    path: string[] = [],
  ): void {

    if (isColumnValue(value)) {
      values.set(
        prefix + path.join("."),
        value
      );
      return;
    }

    if (Array.isArray(value)) {
      return;
    }

    if (
      value !== null &&
      typeof value === "object"
    ) {
      for (const [key, child] of Object.entries(value)) {
        if (
          path.length === 0 &&
          excludedTopLevelKeys.has(key)
        ) {
          continue;
        }

        path.push(key);

        this.collectValues(
          values,
          prefix,
          child,
          excludedTopLevelKeys,
          path,
        );

        path.pop();
      }
    }
  }

  private collectArrays(
    value: JsonValue,
    result: ArrayLocation[],
    path: string[] = []
  ): void {
    if (
      value === null ||
      typeof value !== "object"
    ) {
      return;
    }

    if (Array.isArray(value)) {
      result.push({
        path: [...path],
        values: value,
      });

      return;
    }

    for (const [key, child] of Object.entries(value)) {
      path.push(key);

      this.collectArrays(
        child,
        result,
        path
      );

      path.pop();
    }
  }

  private resolveNestedMappings(
    mapping: ImportMapping,
    source: JsonValue
  ): ImportMapping[] {

    const explicit = mapping.nestedMappings;

    const inferred: ImportMapping[] = [];

    if (source && typeof source === "object" && !Array.isArray(source)) {

      const arrays: ArrayLocation[] = [];

      this.collectArrays(
        source,
        arrays
      );
    
      for (const array of arrays) {

        const alreadyMapped =
          explicit.some(m =>
            arraysEqual(
              m.sourceResolver.identityParts(),
              array.path
            )
          );

        if (alreadyMapped) {
          continue;
        }

        const inferredResolver: ImportSource = {
          resolveMany: () => array.values,
          resolveFirst: () => array.values[0] ?? null,
          consumedKeys: () => [],
          identityParts: () => array.path,
        };

        inferred.push(
          new ImportMapping({
            sourceResolver: inferredResolver
          })
        );
      }
    }

    return [...explicit, ...inferred];
  }
}

export function inferredPrefix(obj: FsObject): string {
  return toPascalCase(obj.basename) + ".";
}