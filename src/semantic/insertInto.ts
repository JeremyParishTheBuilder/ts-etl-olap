import { type Action } from "../actions/Action.js";
import { InsertRowAction } from "../actions/InsertRowAction.js";
import { type InsertIntoStatement } from "../statements/index.js";
import { type Column, type ColumnValue } from "../schema/Column.js";
import { getOrderedColumns, resolveUniqueColumnList } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type SemanticValue, toSemanticValues } from "./values.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";

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

  const tableName: string = stmt.table;
  const table = semantic.ctx.requireTable(tableName);
  
  const allTableColumns: Column[] = getOrderedColumns(table);

  const effectiveColumnsList = resolveUniqueColumnList(
    allTableColumns,
    stmt.columns,
  );

  const inputIndexMap = new Map<string, number>();
  effectiveColumnsList.forEach((name, i) => inputIndexMap.set(name, i));

  assertAtLeastOneRowOfValues(stmt.values);

  //Separate values into Rows
  for (const row of stmt.values) {

    assertRowLengthMatchesColumnLength(row, effectiveColumnsList);

    const insertValues = toSemanticValues(row, semantic.ctx.rules.values.keywords);

    const resolvedRow: ColumnValue[] = resolveSemanticRow(
      insertValues,
      allTableColumns,
      inputIndexMap
    );

    stmtActions.push(new InsertRowAction(
      semantic.ctx.requireDatabase().name,
      tableName,
      resolvedRow
    ));
    // By the time an InsertRowAction is created:
    // Row length == number of columns
    // Column order == table schema order
    // All defaults already applied
    // Explicit NULLs already decided
    // No ambiguity remains
  }

  return stmtActions;
}



function assertAtLeastOneRowOfValues(values: ColumnValue[][]): void {
  if (values.length === 0) {
    throw new Error(`INSERT must contain at least one row`);
  }
}

function assertRowLengthMatchesColumnLength(row: ColumnValue[], columns: string[]): void {
  if (row.length !== columns.length) {
    throw new Error(`Row length and Column length mismatch`);
  }
}

function resolveSemanticRow(
  semanticValues: SemanticValue[],
  allTableColumns: Column[],
  inputIndexMap: Map<string, number>,
): ColumnValue[] {
  const resolvedRow: ColumnValue[] = [];

  for (const column of allTableColumns) {
    const insertIndex = inputIndexMap.get(normalizeIdentifier(column.name));

    let resolvedValue;

    if (insertIndex === undefined) {
      if (column.defaultValue !== undefined) {
        resolvedValue = column.defaultValue;
      } else if (column.nullable !== false) {
        resolvedValue = null;
      } else {
        throw new Error(`Value for column: ${column.name} is required`);
      }
    } else {
      const semanticValue = semanticValues[insertIndex];

      switch (semanticValue.kind) {
        case "default":
          if (column.defaultValue === undefined) {
            throw new Error(`No default value for column ${column.name}`);
          }
          resolvedValue = column.defaultValue;
          break;

        case "null":
          resolvedValue = null;
          break;

        case "value":
          resolvedValue = semanticValue.value;
          break;

        default:
          throw new Error(`Invalid SemanticValue kind`);
      }
    }

    resolvedRow.push(resolvedValue);
  }

  return resolvedRow;
}