import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class JsonPathResolver implements ImportSourceResolver {
  constructor(
    private readonly path: string[]
  ) {}

  resolveMany = (source: unknown): unknown[] => {
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

  resolveFirst = (source: unknown): unknown => {
    const values = this.resolveMany(source);

    return values.length
      ? values[0]
      : undefined;
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
}