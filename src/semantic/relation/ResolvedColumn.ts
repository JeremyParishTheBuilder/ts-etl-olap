import type { RelationColumn } from "./RelationColumn.js";

export interface ResolvedColumn {
  relationName?: string;
  column: RelationColumn;
}
