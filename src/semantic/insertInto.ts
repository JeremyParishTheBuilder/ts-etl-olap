import { type Action } from "../actions/Action.js";
import { InsertRowAction } from "../actions/InsertRowAction.js";
import { type InsertIntoStatement } from "../statements/index.js";
import { type Column, type ColumnValue } from "../schema/Column.js";
import { getOrderedColumns, resolveUniqueColumnList } from "./resolveColumnList.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { type SemanticValue, toSemanticValues } from "./values.js";
import { normalizeIdentifier } from "../utils/normalizeIdentifier.js";
import { ExplicitInput } from "../types/ExplicitInput.js";

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
  
  const allTableColumns: Column[] = getOrderedColumns(table);

  const effectiveColumnsList = resolveUniqueColumnList(
    allTableColumns,
    stmt.columns,
  );

  const inputIndexMap = new Map<string, number>();
  effectiveColumnsList.forEach((name, i) => inputIndexMap.set(name, i));

  assertAtLeastOneRowOfValues(stmt.values);

  for (const row of stmt.values) {

    assertRowLengthMatchesColumnLength(row, effectiveColumnsList);

    const columnIdToValueMap = new Map<string, ExplicitInput>();

    for (let i = 0; i < effectiveColumnsList.length; i++) {
      const columnName = effectiveColumnsList[i];

       columnIdToValueMap.set(
        normalizeIdentifier(columnName),
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