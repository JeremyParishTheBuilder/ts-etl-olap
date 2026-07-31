import { type Column } from "../relational/Column.js";
import { type ColumnValue } from "../types/ColumnValue.js";

export interface QueryResult {
  readonly columns: readonly string[];
  readonly rows: readonly unknown[][];
}

export function createQueryResult(columns: Column[], data: ColumnValue[][]) {
  const columnNames = columns.map((c) => c.name);

  if (columns.length === 0) {
    return { columns: [], rows: [] };
  }

  const rowCount = data[0]?.length ?? 0;

  // Optional safety check (recommended)
  for (let i = 1; i < data.length; i++) {
    if (data[i].length !== rowCount) {
      throw new Error("Column length mismatch in query result");
    }
  }

  const rows: ColumnValue[][] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const row: ColumnValue[] = [];
    for (let colIndex = 0; colIndex < data.length; colIndex++) {
      row.push(data[colIndex][rowIndex]);
    }
    rows.push(row);
  }

  return {
    columns: columnNames,
    rows,
  };
}
