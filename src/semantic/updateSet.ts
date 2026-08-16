import { type Action } from "../actions/Action.js";
import { UpdateRowsAction } from "../actions/UpdateRowsAction.js";
import { type UpdateSetStatement } from "../statements/index.js";
import { type ColumnId } from "../relational/Column.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { bindExpression, resolveExpression } from "./expression.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import { validateInputNode } from "./toExpressionNode.js";
import { DEFAULT } from "../dialect/keywords.js";
import type { UpdateAssignment } from "../types/UpdateAssignment.js";

export function bindUpdateSet(
  semantic: SemanticAnalyzer,
  stmt: UpdateSetStatement,
) {
  const stmtActions: Action[] = [];

  const ctx = semantic.ctx;

  const database = semantic.ctx.requireDatabase();
  const dbName = database.name;

  const tableName: string = stmt.table;
  const table = database.tables.requireByName(tableName);

  const updateMap = new Map<ColumnId, UpdateAssignment>();

  for (const columnName in stmt.values) {
    const value = stmt.values[columnName];

    const column = table.columns.requireByName(columnName);

    validateInputNode(value, ctx);

    if (value.kind === "default") {
      if (
        column.isAutoIncrement() &&
        !column.autoIncrementAllowsExplicitDefault
      ) {
        throw new Error(
          `AutoIncrement Column ${column.name} does not accept explicit value.`,
        );
      }

      updateMap.set(column.id, DEFAULT);

      continue;
    }

    if (column.isAutoIncrement() && !column.autoIncrementAllowsExplicitValue) {
      throw new Error(
        `AutoIncrement Column ${column.name} does not accept explicit value.`,
      );
    }

    updateMap.set(
      column.id,
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
