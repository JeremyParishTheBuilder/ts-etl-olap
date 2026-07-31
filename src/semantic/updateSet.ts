import { type Action } from "../actions/Action.js";
import { UpdateRowsAction } from "../actions/UpdateRowsAction.js";
import { type UpdateSetStatement } from "../statements/index.js";
import { type ColumnId } from "../relational/Column.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { bindExpression, resolveExpression } from "./expression.js";
import { type Expression } from "../evaluation/expression/Expression.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import { type RowView } from "../relational/RowView.js";

export function bindUpdateSet(
  semantic: SemanticAnalyzer,
  stmt: UpdateSetStatement,
) {
  const stmtActions: Action[] = [];

  const database = semantic.ctx.requireDatabase();
  const dbName = database.name;

  const tableName: string = stmt.table;
  const table = database.tables.requireByName(tableName);

  const updateMap = new Map<ColumnId, Expression<RowView>>();

  for (const columnName in stmt.values) {
    const value = stmt.values[columnName];

    const columnId = table.columns.requireIdByName(columnName);

    updateMap.set(
      columnId,
      bindExpression(resolveExpression(value, table), table),
    );
  }

  const whereClause = stmt.where
    ? bindPredicate(resolvePredicate(stmt.where, table), table)
    : undefined;

  stmtActions.push(
    new UpdateRowsAction(dbName, tableName, updateMap, whereClause),
  );

  return stmtActions;
}
