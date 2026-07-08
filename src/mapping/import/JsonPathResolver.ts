import { toPascalCase } from "../../utils/format.js";
import { type JsonValue } from "../value/JsonValue.js";
import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class JsonPathResolver implements ImportSourceResolver {
  constructor(
    public readonly path: readonly string[]
  ) {}

  resolveMany = (source: JsonValue): JsonValue[] => {
    let current: any = source;

    for (const part of this.path) {
      if (current == null) {
        return [];
      }

      current = current[part];
    }

    if (current == null) {
      return [];
    }

    if (Array.isArray(current)) {
      return current;
    }

    return [current];
  }

  resolveFirst = (source: JsonValue): JsonValue => {
    const values = this.resolveMany(source);

    return values.length
      ? values[0]
      : null;
  }

  consumedKeys(): string[] {
    return this.path.length > 0
      ? [this.path[0]]
      : [];
  }

  static parse(path: string): JsonPathResolver {
    return new JsonPathResolver(
      path.split(".")
    );
  }

  identityParts(): readonly string[] {
    return this.path;
  }
}