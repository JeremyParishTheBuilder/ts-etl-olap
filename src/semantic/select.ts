import { type PlanNode } from "../evaluation/plan/PlanNode.js";
import { TableScanNode } from "../evaluation/plan/TableScanNode.js";
import { FilterNode } from "../evaluation/plan/FilterNode.js";
import { ProjectNode } from "../evaluation/plan/ProjectNode.js";

import { type SelectStatement } from "../statements/index.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type Column } from "../relational/Column.js";
import { resolveSelectColumns } from "./resolveColumnList.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import type { QueryColumn, QueryPlan } from "../evaluation/plan/QueryPlan.js";

export function bindSelect(
  semantic: SemanticAnalyzer,
  stmt: SelectStatement,
): QueryPlan {
  //Get table
  const table = semantic.ctx.requireTable(stmt.tableName);
  const specifiedColumns = stmt.columnNames;

  // 2. Base node
  let node: PlanNode = new TableScanNode(table);

  // 3. WHERE -> predicate -> filter
  const whereClause = stmt.where;
  if (whereClause) {
    const predicate = bindPredicate(
      resolvePredicate(whereClause, table),
      table,
    );

    node = new FilterNode(predicate, node);
  }

  const outputColumns: Column[] = resolveSelectColumns(table, specifiedColumns);

  // 4. Projection
  if (specifiedColumns !== "*") {
    const columnIndexes: number[] = outputColumns.map((c) => c.position);

    node = new ProjectNode(columnIndexes, node);
  }

  const queryColumns: QueryColumn[] = outputColumns.map((column) => ({
    name: column.name,
    type: column.type,
    nullable: column.nullable,
  }));

  return {
    root: node,
    columns: queryColumns,
  };
}
