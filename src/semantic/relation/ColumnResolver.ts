import type { ResolvedColumn } from "./ResolvedColumn.js";

export interface ColumnResolver {
  requireResolvedColumn(reference: string): ResolvedColumn;
}
