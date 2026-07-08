import { type ColumnValue } from "../../types/ColumnValue.js";
import { type ValueResolverContext } from "./ValueResolverContext.js";
import { type ValueResolver } from "./ValueResolver.js";

export class LambdaValueResolver<T = ColumnValue> implements ValueResolver<T> {
  constructor(
    private readonly fn: (ctx: ValueResolverContext) => T
  ) {}

  resolve(context: ValueResolverContext): T {
    return this.fn(context);
  }
}