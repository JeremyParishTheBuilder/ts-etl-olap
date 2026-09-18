import { type Action } from "../actions/Action.js";
import { InsertRowsAction } from "../actions/InsertRowsAction.js";
import { type InsertIntoStatement } from "../statements/index.js";
import { type ColumnId, type Column } from "../relational/Column.js";
import { resolveTargetColumns } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { assertInsertExpression, bindInsertExpression } from "./expression.js";
import { validateInputNode } from "./toExpressionNode.js";
import { DefaultValueNode } from "../ast/DefaultValueNode.js";
import type { ColumnInput } from "../types/ColumnInput.js";
import { DEFAULT } from "../dialect/keywords.js";
import type { ExpressionNode } from "../ast/expression/ExpressionNode.js";
import { InsertSelectAction } from "../actions/InsertSelectAction.js";
import { isSameType } from "../types/SqlType.js";
import type { Table } from "../relational/Table.js";
import { bindQuery } from "./query.js";
import type { QueryStatement } from "../statements/dql/QueryStatement.js";

export function bindInsertInto(
  semantic: SemanticAnalyzer,
  stmt: InsertIntoStatement,
) {
  const database = semantic.ctx.requireDatabase();
  const table = semantic.ctx.requireTable(stmt.table);
  const effectiveColumns = resolveTargetColumns(table, stmt.columns);

  switch (stmt.source.kind) {
    case "values":
      return bindInsertValues(
        semantic,
        database.name,
        table,
        effectiveColumns,
        stmt.source.rows,
      );

    case "query":
      return bindInsertQuery(
        semantic,
        database.name,
        table,
        effectiveColumns,
        stmt.source.query,
      );

    case "defaultValues":
      return bindInsertDefaultValues(database.name, table, effectiveColumns);

    default:
      throw new Error(
        "INSERT requires either VALUES, DEFAULT VALUES, or a query.",
      );
  }
}

function bindInsertQuery(
  semantic: SemanticAnalyzer,
  dbName: string,
  targetTable: Table,
  targetColumns: Column[],
  query: QueryStatement,
): Action[] {
  const queryPlan = bindQuery(semantic, query);

  const selectColumns = queryPlan.columns;

  if (selectColumns.length !== targetColumns.length) {
    throw new Error(
      "Column length mismatch between query statement and target columns.",
    );
  }

  for (let i = 0; i < targetColumns.length; i++) {
    if (!isSameType(targetColumns[i].type, selectColumns[i].type)) {
      throw new Error(`Query column type does not match target column type.`);
    }
  }

  return [
    new InsertSelectAction(
      dbName,
      targetTable.name,
      targetColumns.map((c) => c.id),
      queryPlan,
    ),
  ];
}

function bindInsertValues(
  semantic: SemanticAnalyzer,
  dbName: string,
  targetTable: Table,
  targetColumns: Column[],
  values: (ExpressionNode | DefaultValueNode)[][],
): Action[] {
  const ctx = semantic.ctx;

  assertAtLeastOneRowOfValues(values);

  const inputRows: Map<ColumnId, ColumnInput>[] = [];

  for (const row of values) {
    assertRowLengthMatchesColumnLength(row, targetColumns);

    const columnIdToColumnInputMap = new Map<ColumnId, ColumnInput>();

    for (let i = 0; i < targetColumns.length; i++) {
      const column = targetColumns[i];
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

  return [new InsertRowsAction(dbName, targetTable.name, inputRows)];
}

function bindInsertDefaultValues(
  dbName: string,
  targetTable: Table,
  targetColumns: Column[],
): Action[] {
  const inputRow = new Map<ColumnId, ColumnInput>();

  for (const column of targetColumns) {
    inputRow.set(column.id, DEFAULT);
  }

  return [new InsertRowsAction(dbName, targetTable.name, [inputRow])];
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
