import { type RowView } from "../../schema/RowView.js";

export function assertColumnIndexWithinRow(idx: number, row: RowView): void {
  if (idx < 0 || idx >= row.values.length) {
    throw new Error(`Cell index out of bounds`);
  }
}