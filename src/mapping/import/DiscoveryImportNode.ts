import { type ColumnValue } from "../../types/ColumnValue.js";
import { toPascalCase } from "../../utils/format.js";
import { type DiscoveryResult } from "../discovery/DiscoveryResult.js";
import { type ImportMapping } from "./ImportMapping.js";
import { ImportNode } from "./ImportNode.js";
import { ImportResult } from "./ImportResult.js";

export interface DiscoveryImportNodeSpec {
  readonly acceptsNodeType: string;
  readonly mapping: ImportMapping;
}

export class DiscoveryImportNode implements ImportNode {
  constructor(
    readonly spec: DiscoveryImportNodeSpec
  ) {}

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
    const values = new Map<string, ColumnValue>();

    const resolverContext = {
      source: null,
      captures: discovery.captures,
      capture(name: string): ColumnValue {
        const value = discovery.captures.get(name);

        if (value === undefined) {
          throw new Error(`Missing capture '${name}'.`);
        }

        return value;
      },
      rowIdentity: discovery.identity
    };

    const prefix = this.spec.mapping.prefix ?? this.inferredPrefix();

    for (const [name, builder] of Object.entries(this.spec.mapping.fields?? {})) {
      values.set(
        prefix + name,
        builder.evaluate(resolverContext)
      );
    }

    return [
      new ImportResult(
        this.spec.mapping,
        discovery,
        discovery.captures,
        values,
        discovery.identity
      )
    ];
  }

  inferredPrefix(): string {
    return toPascalCase(this.spec.acceptsNodeType) + ".";
  }
}