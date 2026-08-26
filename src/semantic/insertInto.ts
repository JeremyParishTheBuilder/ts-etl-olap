import { type Action } from "../actions/Action.js";
import { InsertRowsAction } from "../actions/InsertRowsAction.js";
import { type InsertIntoStatement } from "../statements/index.js";
import { type ColumnId, type Column } from "../relational/Column.js";
import { resolveTargetColumns } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { assertInsertExpression, bindInsertExpression } from "./expression.js";
import { validateInputNode } from "./toExpressionNode.js";
import type { DefaultValueNode } from "../ast/DefaultValueNode.js";
import type { ColumnInput } from "../types/ColumnInput.js";
import { DEFAULT } from "../dialect/keywords.js";
import type { ExpressionNode } from "../ast/expression/ExpressionNode.js";

export function bindInsertInto(
  semantic: SemanticAnalyzer,
  stmt: InsertIntoStatement,
) {
  const ctx = semantic.ctx;
  const stmtActions: Action[] = [];

  const database = semantic.ctx.requireDatabase();
  const dbName: string = database.name;

  const tableName: string = stmt.table;
  const table = semantic.ctx.requireTable(tableName);

  const effectiveColumns: Column[] = resolveTargetColumns(table, stmt.columns);

  assertAtLeastOneRowOfValues(stmt.values);

  const inputRows: Map<ColumnId, ColumnInput>[] = [];

  for (const row of stmt.values) {
    assertRowLengthMatchesColumnLength(row, effectiveColumns);

    const columnIdToColumnInputMap = new Map<ColumnId, ColumnInput>();

    for (let i = 0; i < effectiveColumns.length; i++) {
      const column = effectiveColumns[i];
      const valueNode = row[i];

      validateInputNode(valueNode, ctx);

      if (valueNode.kind === "default") {
        if (
          column.isAutoIncrement() &&
          !column.autoIncrementAllowsExplicitDefault
        ) {
          throw new Error(
            `AutoIncrement Column ${column.name} does not accept explicit value.`,
          );
        }

        columnIdToColumnInputMap.set(column.id, DEFAULT);

        continue;
      }

      if (
        column.isAutoIncrement() &&
        !column.autoIncrementAllowsExplicitValue
      ) {
        throw new Error(
          `AutoIncrement Column ${column.name} does not accept explicit value.`,
        );
      }

      assertInsertExpression(valueNode);

      const value = bindInsertExpression(valueNode).evaluate(undefined);

      columnIdToColumnInputMap.set(column.id, value);
    }

    inputRows.push(columnIdToColumnInputMap);
  }

  stmtActions.push(new InsertRowsAction(dbName, tableName, inputRows));

  return stmtActions;
}

function assertAtLeastOneRowOfValues(
  values: (ExpressionNode | DefaultValueNode)[][],
): void {
  if (values.length === 0) {
    throw new Error(`INSERT must contain at least one row`);
  }
}

function assertRowLengthMatchesColumnLength(
  row: (ExpressionNode | DefaultValueNode)[],
  columns: Column[],
): void {
  if (row.length !== columns.length) {
    throw new Error(`Row length and Column length mismatch`);
  }
}
