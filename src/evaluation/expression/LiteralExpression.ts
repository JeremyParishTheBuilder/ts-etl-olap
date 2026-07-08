import { type RowView } from "../../schema/RowView.js";
import { type ColumnValue } from "../../types/ColumnValue.js";

export class LiteralExpressionNode {
  readonly kind = "literal" as const;

  constructor(
    public readonly value: ColumnValue
  ) {}
}

export class LiteralExpression {
  constructor(
    public value: ColumnValue
  ) {}

  evaluate(row: RowView): ColumnValue {
    return this.value;
  }
}