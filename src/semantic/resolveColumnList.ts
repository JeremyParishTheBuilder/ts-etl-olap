import { type Column } from "../schema/Column.js";
import { type Table } from "../schema/Table.js";

export function getOrderedColumns(table: Table): Column[] {
  return Array.from(table.columns.values())
    .sort((a, b) => a.position - b.position);
}

export function getColumnIndexMap(table: Table): Map<string, number> {
  const map = new Map<string, number>();
  for (const col of table.columns.values()) {
    map.set(col.name.toLowerCase(), col.position);
  }
  return map;
}

export function resolveUniqueColumnList(
  allTableColumns: Column[],
  statementColumns: string[],
): string[] {
  let effectiveColumnsList: string[];

  const tableColumnNames = new Set(
    allTableColumns.map(c => c.name.toLowerCase()));
    
  let normalizedInputColumns: string[] = [...statementColumns].map(c => c.toLowerCase());

  // Either use explicitly given columns, or all columns
  if (
    normalizedInputColumns.length === 0 ||
    (normalizedInputColumns.length === 1 && normalizedInputColumns[0] === "*")
  ) {
    effectiveColumnsList = allTableColumns.map(c => c.name.toLowerCase());
  } else {
    //Check for input column validity
    const seen = new Set<string>();
    for (const col of normalizedInputColumns) {
      if (!tableColumnNames.has(col)) {
        throw new Error(`Unknown column: ${col}`);
      }
      if (seen.has(col)) {
        throw new Error(`Duplicate column: ${col}`);
      }
      seen.add(col);
    }

    effectiveColumnsList = normalizedInputColumns;
  }

  return effectiveColumnsList;
}

export function resolveSelectColumnList(
  allTableColumns: Column[],
  statementColumns: string[] | "*"
): string[] {
  const tableColumnNames = new Set(
    allTableColumns.map(c => c.name.toLowerCase())
  );

  // SELECT *
  if (statementColumns === "*") {
    return allTableColumns.map(c => c.name.toLowerCase());
  }

  const effectiveColumnsList: string[] = [];

  for (const col of statementColumns) {
    const normalized = col.toLowerCase();

    if (!tableColumnNames.has(normalized)) {
      throw new Error(`Unknown column: ${col}`);
    }

    effectiveColumnsList.push(normalized); // duplicates allowed
  }

  return effectiveColumnsList;
}