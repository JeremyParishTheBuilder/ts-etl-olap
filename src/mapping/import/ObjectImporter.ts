import { type ColumnValue, isColumnValue } from "../../types/ColumnValue.js";
import { arraysEqual } from "../../utils/arrayHelpers.js";
import { pathToPascalCase } from "../../utils/format.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import { type JsonValue } from "../value/json/JsonValue.js";
import { type ValueResolverContext } from "../value/ValueResolverContext.js";
import { type ArrayLocation } from "./ArrayLocation.js";
import { type ImportContext } from "./ImportContext.js";
import { ImportMapping } from "./ImportMapping.js";
import { ImportResult } from "./ImportResult.js";
import { type ImportSource } from "./ImportSource.js";

export class ObjectImporter {
  import(
    discovery: DiscoveryResult,
    context: ImportContext,
    mapping: ImportMapping,
    source: JsonValue,
    prefix: string,
  ): ImportResult[] {
    const results: ImportResult[] = [];

    const values = new Map<string, ColumnValue>();

    const excludedProperties = new Set(
      mapping.children.flatMap(m => m.source.consumedKeys())
    );

    const effectivePrefix = mapping.prefix ?? prefix;

    this.flattenColumns(
      values,
      effectivePrefix,
      source,
      excludedProperties,
    );

    let childContext = context;

    let resolverContext: ValueResolverContext = {
      source,
      captures: childContext.captures,
      capture(name: string): CaptureValue {
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
      ...mapping.source.identityParts()
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
      const nestedSources = child.source.resolveMany(source);

      const childPrefix =
        (mapping.prefix ?? prefix)
        + pathToPascalCase(
            child.source.identityParts()
        )
        + ".";

      for (const [index, nested] of nestedSources.entries()) {
        const nestedIdentity = rowIdentity.append(index);

        const context = childContext.withIdentity(nestedIdentity);

        results.push(
          ...this.import(
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

  private flattenColumns(
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

        this.flattenColumns(
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

    const explicit = mapping.children;

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
              m.source.identityParts(),
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
            source: inferredResolver
          })
        );
      }
    }

    return [...explicit, ...inferred];
  }
}