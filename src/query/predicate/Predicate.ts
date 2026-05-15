import { type RowView } from "../../schema/RowView.js";

export interface Predicate {
  evaluate(row: RowView): boolean;
}