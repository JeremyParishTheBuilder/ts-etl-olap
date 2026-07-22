import { type ColumnValue, isColumnValue } from "../../types/ColumnValue.js";
import { pathToPascalCase, toPascalCase } from "../../utils/format.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import type { CaptureValue } from "../value/CaptureValue.js";
import { isStructuredValue, type StructuredValue } from "../value/StructuredValue.js";
import { type ValueResolverContext } from "../value/ValueResolverContext.js";
import { ImportContext } from "./ImportContext.js";
import { ImportMapping } from "./ImportMapping.js";
import { ImportResult } from "./ImportResult.js";
import { ImportRowIdentity } from "./ImportRowIdentity.js";

export class ObjectImporter {

  import(
    discovery: DiscoveryResult,
    mapping: ImportMapping,
  ): ImportResult[] {

    const context = new ImportContext(
      discovery,
      discovery.identity,
      discovery.value,
    );

    return this.importInternal(
      context,
      mapping,
    );
  }

  importInternal(
    context: ImportContext,
    mapping: ImportMapping,
  ): ImportResult[] {
    const results: ImportResult[] = [];

    const excludedProperties = new Set(
      mapping.children.flatMap(
        child => child.source?.consumedKeys() ?? []
      )
    );

    const currentNamespace =
      this.currentNamespace(
        context,
        mapping
      );

    const contexts = mapping.source?.navigate(context) ?? [context];

    for (const childContext of contexts) {

      const source = childContext.source;

      if (!isStructuredValue(source)) {
        throw new Error("Import source must be structured.");
      }

      const values = new Map<string, ColumnValue>();

      if (
        source !== null &&
        typeof source === "object" &&
        !Array.isArray(source) &&
        mapping.flatten !== false
      ) {
        this.flattenColumns(
          values,
          currentNamespace,
          source,
          excludedProperties,
        );
      }

      const rowIdentity = mapping.tableName === context.tableName
        ? context.identity
        : childContext.discovery.identity

      const resolverContext: ValueResolverContext = {
        source,
        captures: childContext.discovery.captures,
        capture(name: string): CaptureValue {
          const value = childContext.discovery.captures.get(name);

          if (value === undefined) {
            throw new Error(`Missing capture '${name}'.`);
          }

          return value;
        },
        rowIdentity,
      };

      for (const [name, builder] of Object.entries(mapping.fields ?? {})) {
        values.set(
          this.qualifyColumn(
            currentNamespace,
            name
          ),
          builder.evaluate(resolverContext)
        );
      }
      
      if (mapping.tableName) {
        results.push(
          new ImportResult(
            mapping.tableName,
            rowIdentity,
            values
          )
        );
      }

      let nextContext = childContext
        .withIdentity(rowIdentity)

      if (mapping.tableName) {
        nextContext = nextContext.withTable(mapping.tableName);
      }

      nextContext = nextContext.withNamespace(currentNamespace);

      results.push(
        ...this.importChildren(
          nextContext,
          mapping,
        )
      );
    }

    return results;
  }

  private importChildren(
    context: ImportContext,
    mapping: ImportMapping
  ): ImportResult[] {
    const results: ImportResult[] = [];
      
    for (const childMapping of mapping.children) {
      results.push(
        ...this.importInternal(
          context,
          childMapping,
        )
      );
    }

    return results;
  }

  private flattenColumns(
    values: Map<string, ColumnValue>,
    namespace: readonly string[],
    value: StructuredValue,
    excludedProperties: ReadonlySet<string>,
    path: string[] = [],
  ): void {
    const fullNamespace = [
      ...namespace,
      ...path.map(toPascalCase),
    ];

    if (isColumnValue(value)) {
      values.set(
        fullNamespace.join("."),
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
          excludedProperties.has(key)
        ) {
          continue;
        }

        path.push(key);

        this.flattenColumns(
          values,
          namespace,
          child,
          excludedProperties,
          path
        );

        path.pop();
      }
    }
  }

  private qualifyColumn(
    namespace: readonly string[],
    name: string,
  ): string {
    const parts = [
      ...namespace,
      toPascalCase(name),
    ];

    return parts.join(".");
  }

  private currentNamespace(
    context: ImportContext,
    mapping: ImportMapping,
): readonly string[] {

    if (!mapping.tableName) {
      return context.namespace;
    }

    const segment = mapping.prefix ??
      mapping.source?.columnNamespace();

    if (context.tableName !== mapping.tableName) {
      return [];
    }

    if (!segment) {
      return context.namespace;
    }

    return [
      ...context.namespace,
      segment,
    ];
  }
}