import { type PlanNode } from "../evaluation/plan/PlanNode.js";
import { TableScanNode } from "../evaluation/plan/TableScanNode.js";
import { FilterNode } from "../evaluation/plan/FilterNode.js";
import { ProjectNode } from "../evaluation/plan/ProjectNode.js";

import { type SelectStatement } from "../statements/index.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type Column } from "../schema/Column.js";
import { getColumnIndexMap, getOrderedColumns, resolveSelectColumnList } from "./resolveColumnList.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";

export function bindSelect(
  semantic: SemanticAnalyzer,
  stmt: SelectStatement
) {
  //Get table
  const table = semantic.ctx.requireTable(stmt.tableName);
  const specifiedColumns = stmt.columnNames;

  // 1. Resolve columns -> indexes
  const allTableColumns: Column[] = getOrderedColumns(table);

  const effectiveColumns = resolveSelectColumnList(
    allTableColumns,
    specifiedColumns
  );

  const columnIndexMap = getColumnIndexMap(table); // TODO, see if position map can eliminate this
  const columnIndexes = effectiveColumns.map(name => columnIndexMap.get(name)!);

  // 2. Base node
  let node: PlanNode = new TableScanNode(table);

  // 3. WHERE -> predicate -> filter
  const whereClause = stmt.where;
  if (whereClause) {
    const predicate = bindPredicate(resolvePredicate(whereClause, table), table);
    node = new FilterNode(predicate, node);
  }

  // 4. Projection
  if (specifiedColumns !== "*") {
    node = new ProjectNode(columnIndexes, node);
  }

  return { root: node };
}