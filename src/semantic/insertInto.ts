import { type Action } from "../actions/Action.js";
import { InsertRowAction } from "../actions/InsertRowAction.js";
import { type InsertIntoStatement } from "../statements/index.js";
import { type ColumnId, type Column } from "../relational/Column.js";
import { type ColumnValue } from "../types/ColumnValue.js";
import { resolveTargetColumns } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";

  // Handles interpretation and completion of user intent:

  // Expanding partial INSERT into full rows
  // Resolving:
  // Default values
  // Column ordering
  // Missing columns
  // Validating statement semantics (before execution)
export function bindInsertInto(
  semantic: SemanticAnalyzer,
  stmt: InsertIntoStatement
) {
  const stmtActions: Action[] = [];
  
  const database = semantic.ctx.requireDatabase();
  const dbName: string = database.name;

  const tableName: string = stmt.table;
  const table = semantic.ctx.requireTable(tableName);

  const effectiveColumns: Column[] = resolveTargetColumns(table, stmt.columns);

  assertAtLeastOneRowOfValues(stmt.values);

  for (const row of stmt.values) {

    assertRowLengthMatchesColumnLength(row, effectiveColumns);

    const columnIdToValueMap = new Map<ColumnId, ExplicitInput>();

    for (let i = 0; i < effectiveColumns.length; i++) {
       columnIdToValueMap.set(
        effectiveColumns[i].id,
        row[i]
      );
    }

    stmtActions.push(
      new InsertRowAction(
        dbName,
        tableName,
        columnIdToValueMap,
      )
    );
  }

  return stmtActions;
}

function assertAtLeastOneRowOfValues(values: ColumnValue[][]): void {
  if (values.length === 0) {
    throw new Error(`INSERT must contain at least one row`);
  }
}

function assertRowLengthMatchesColumnLength(row: ColumnValue[], columns: Column[]): void {
  if (row.length !== columns.length) {
    throw new Error(`Row length and Column length mismatch`);
  }
}