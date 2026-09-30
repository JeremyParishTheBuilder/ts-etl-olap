import type { Table } from "../../relational/Table.js";
import type { SqlType } from "../../types/SqlType.js";
import { type PlanNode } from "./PlanNode.js";

export interface QueryPlan {
  root: PlanNode;
  columns: readonly QueryColumn[];
}

export type QueryColumn = {
  name: string;
  type: SqlType;
  nullable: boolean;
};

export function queryColumnsFromTable(table: Table): QueryColumn[] {
  return [...table.columns.values()].map((column) => ({
    name: column.name,
    type: column.type,
    nullable: column.nullable,
  }));
}
