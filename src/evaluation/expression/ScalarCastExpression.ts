import type { CaptureValue } from "../../mapping/value/CaptureValue.js";
import { isColumnValue, type ColumnValue } from "../../types/ColumnValue.js";
import type { Expression } from "./Expression.js";

export class ScalarCastExpression<TContext> implements Expression<
  TContext,
  ColumnValue
> {
  constructor(readonly source: Expression<TContext, CaptureValue>) {}

  evaluate(context: TContext): ColumnValue {
    const value = this.source.evaluate(context);

    if (isColumnValue(value)) {
      return value;
    }

    return null;
  }
}
