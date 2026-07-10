import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Expression, ExpressionNodeBase } from "./Expression.js";

export class LiteralExpressionNode extends ExpressionNodeBase {
  readonly kind = "literal" as const;

  constructor(
    public readonly value: ColumnValue
  ) {
    super();
  }
}

export class LiteralExpression<TContext, TValue>
  implements Expression<TContext, TValue> {
  constructor(
    public value: TValue
  ) {}

  evaluate(context: TContext): TValue {
    return this.value;
  }
}