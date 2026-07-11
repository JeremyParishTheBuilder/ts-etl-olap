import { type RowView } from "../../schema/RowView.js";
import { type ColumnValue } from "../../types/ColumnValue.js";
import { assertColumnIndexWithinRow } from "../row/assertColumnIndexWithinRow.js";

export class ColumnExpression {
  constructor(
    public columnPosition: number,
  ) {}

  evaluate(row: RowView): ColumnValue {
    assertColumnIndexWithinRow(this.columnPosition, row);

    return row.values[this.columnPosition];
  }
}