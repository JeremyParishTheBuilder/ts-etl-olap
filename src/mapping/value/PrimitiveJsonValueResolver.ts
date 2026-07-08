import { type ColumnValue, isColumnValue } from "../../types/ColumnValue.js";
import { type ValueResolverContext } from "./ValueResolverContext.js";
import { type JsonPathResolver } from "../import/JsonPathResolver.js";
import { type ValueResolver } from "./ValueResolver.js";

export class PrimitiveJsonValueResolver implements ValueResolver<ColumnValue> {
  constructor(
    private readonly path: JsonPathResolver
  ) {}

  resolve(context: ValueResolverContext): ColumnValue {
    const value = this.path.resolveFirst(context.source);

    if (!isColumnValue(value)) {
      throw new Error(`Json Value at ${this.path} is not a primitive.`);
    }

    return value;
  }
}