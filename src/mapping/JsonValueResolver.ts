import { type JsonPathResolver } from "./JsonPathResolver.js";
import { type ValueResolver } from "./ValueResolver.js";

export class JsonValueResolver implements ValueResolver {
  constructor(
    private readonly path: JsonPathResolver
  ) {}

  resolve(source: unknown): unknown {
    const values = this.path.resolveMany(source);

    return values.length
      ? values[0]
      : undefined;
  }
}