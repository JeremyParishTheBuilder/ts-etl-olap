import { type RowView } from "../../relational/RowView.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { assertColumnIndexWithinRow } from "../row/assertColumnIndexWithinRow.js";
import type { Expression } from "./Expression.js";

export class ColumnExpression implements Expression<RowView> {
  constructor(public columnPosition: number) {}

  evaluate(row: RowView): ColumnValue {
    assertColumnIndexWithinRow(this.columnPosition, row);

    return row.values[this.columnPosition];
  }
}
