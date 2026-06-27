import { type ImportSourceResolver } from "./ImportSourceResolver.js";

export class JsonPathResolver implements ImportSourceResolver {
  constructor(
    private readonly path: string[]
  ) {}

  resolve(source: unknown): unknown[] {
    let current: any = source;

    for (const part of this.path) {
      if (current == null) {
        return [];
      }

      current = current[part];
    }

    return current;
  }

  consumedKeys(): string[] {
    return this.path.length > 0
      ? [this.path[0]]
      : [];
  }
}