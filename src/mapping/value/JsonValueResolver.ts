import { type JsonPath } from "../import/JsonPath.js";
import { type JsonValue } from "./JsonValue.js";
import { type ValueResolver } from "./ValueResolver.js";
import { type ValueResolverContext } from "./ValueResolverContext.js";

export class JsonValueResolver implements ValueResolver<JsonValue> {
  constructor(
    private readonly path: JsonPath
  ) {}

  resolve(context: ValueResolverContext): JsonValue {
    const values = this.path.resolveMany(context.source);

    return values.length
      ? values[0] as JsonValue
      : null;
  }
}