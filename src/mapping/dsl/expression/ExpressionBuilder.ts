import { type Expression } from "../../../evaluation/expression/Expression.js";
import { type ColumnValue } from "../../../types/ColumnValue.js";

export class ExpressionBuilder<TContext, TResult = ColumnValue> {
  constructor(readonly expression: Expression<TContext, TResult>) {}

  evaluate(context: TContext): TResult {
    return this.expression.evaluate(context);
  }

  consumedKeys(): readonly string[] {
    return this.expression.consumedKeys?.() ?? [];
  }
}
