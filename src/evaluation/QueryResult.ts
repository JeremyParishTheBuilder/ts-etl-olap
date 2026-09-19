import type { QueryColumn } from "./plan/QueryPlan.js";
import type { RowView } from "../relational/RowView.js";

export interface QueryResult {
  readonly columns: readonly QueryColumn[];
  readonly rows: readonly RowView[];
}
