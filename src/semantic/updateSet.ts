import { type Action } from "../actions/Action.js";
import { UpdateRowAction } from "../actions/UpdateRowAction.js";
import { type UpdateSetStatement } from "../statements/index.js";
import { type ColumnId } from "../schema/Column.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { TableScanNode } from "../query/plan/TableScanNode.js";
import { PlanNode } from "../query/plan/PlanNode.js";
import { bindPredicate } from "./predicate.js";
import { FilterNode } from "../query/plan/FilterNode.js";
import { Table } from "../schema/Table.js";
import { WhereClause } from "../statements/WhereClause.js";
import { RowView } from "../schema/RowView.js";


// export interface UpdateSetStatement extends BaseStatement {
//   kind: "update_set",
//   table: string,
//   values: Record<string, ExplicitInput>,
//   where?: WhereClause,
//   returning?: string[],
// }

export function bindUpdateSet(
  semantic: SemanticAnalyzer,
  stmt: UpdateSetStatement,
) {
  const stmtActions: Action[] = [];

  const database = semantic.ctx.requireDatabase();
  const dbName = database.name;

  const tableName: string = stmt.table;
  const table = database.tables.requireByName(tableName);

  const columnIdToValueMap = new Map<ColumnId, ExplicitInput>();

  for (const columnName in stmt.values) {
    const value = stmt.values[columnName];

    const columnId = table.columns.requireIdByName(columnName);

    columnIdToValueMap.set(columnId, value);
  }

  const rows = resolveAffectedRows(
      semantic,
      table,
      stmt.where,
  );

  for (const row of rows) {
    stmtActions.push(
      new UpdateRowAction(
        dbName,
        tableName,
        row.index,
        columnIdToValueMap,
      )
    );
  }

  return stmtActions;
}

function resolveAffectedRows(
  semantic: SemanticAnalyzer,
  table: Table,
  where: WhereClause | undefined,
): RowView[] {
  let node: PlanNode = new TableScanNode(table);

  if (where) {
    const predicate = bindPredicate(semantic, where, table);
    node = new FilterNode(predicate, node);
  }

  return [...node.execute()];
}
