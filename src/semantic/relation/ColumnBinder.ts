import type { ResolvedColumn } from "./ResolvedColumn.js";

export interface ColumnBinder {
  requireColumnPosition(column: ResolvedColumn): number;
}
