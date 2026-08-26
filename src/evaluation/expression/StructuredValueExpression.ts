import type { Expression } from "./Expression.js";
import type { StructuredValue } from "../../mapping/value/StructuredValue.js";

export class StructuredValueExpression<TContext> implements Expression<
  TContext,
  StructuredValue
> {
  constructor(readonly value: StructuredValue) {}

  evaluate(_context: TContext): StructuredValue {
    return this.value;
  }
}
