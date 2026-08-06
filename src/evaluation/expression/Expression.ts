import { type ColumnValue } from "../../types/ColumnValue.js";
import { type RowView } from "../../relational/RowView.js";

export interface Expression<TContext = RowView, TValue = ColumnValue> {
  evaluate(context: TContext): TValue;
  consumedKeys?(): readonly string[];
}
