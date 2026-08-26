import { type ColumnValue } from "../../types/ColumnValue.js";
import { castValue, type SqlType } from "../../types/SqlType.js";
import { type Expression } from "./Expression.js";

export class CastExpression<TContext> implements Expression<TContext> {
  public constructor(
    public readonly expr: Expression<TContext>,
    public readonly type: SqlType,
  ) {}

  evaluate(context: TContext): ColumnValue {
    const value = this.expr.evaluate(context);

    return castValue(value, this.type);
  }
}
