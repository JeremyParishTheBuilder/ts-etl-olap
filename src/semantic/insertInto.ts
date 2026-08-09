import { type Action } from "../actions/Action.js";
import { InsertRowsAction } from "../actions/InsertRowsAction.js";
import { type InsertIntoStatement } from "../statements/index.js";
import { type ColumnId, type Column } from "../relational/Column.js";
import { type ColumnValue } from "../types/ColumnValue.js";
import { resolveTargetColumns } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { assertInsertExpression, bindInsertExpression } from "./expression.js";
import { resolveDefaultValue } from "./defaultValue.js";
import { validateInputNode } from "./toExpressionNode.js";
import type { ExpressionNode } from "../ast/expression/ExpressionNode.js";
import type { DefaultValueNode } from "../ast/DefaultValueNode.js";

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

  const inputRows: Map<ColumnId, ColumnValue>[] = [];

  for (const row of stmt.values) {
    assertRowLengthMatchesColumnLength(row, effectiveColumns);

    const columnIdToValueMap = new Map<ColumnId, ColumnValue>();

    for (let i = 0; i < effectiveColumns.length; i++) {
      const column = effectiveColumns[i];
      const valueNode = row[i];

      validateInputNode(valueNode, ctx);

      if (valueNode.kind === "default") {
        columnIdToValueMap.set(
          column.id,
          resolveDefaultValue<undefined>(valueNode, column, "insert").evaluate(
            undefined,
          ),
        );

        continue;
      }

      assertInsertExpression(valueNode);

      const value = bindInsertExpression(valueNode, table).evaluate(undefined);

      columnIdToValueMap.set(column.id, value);
    }

    inputRows.push(columnIdToValueMap);
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
