import type { ColumnValue, Column } from "../types/Column.js";
import type { Table } from "../types/Table.js";

export type InsertValue =
  | { kind: "value"; value: ColumnValue }
  | { kind: "default" }
  | { kind: "null" }
  | { kind: "generated" }
  | { kind: "expression"; expr: any/*Expression*/ };

export type InsertCell = {
  column: Column;
  input: InsertValue;
};

export type InsertRow = InsertCell[];

export function bindInsertRows(
  table: Table,
  columns: string[] | null,
  values: InsertValue[][]
): InsertRow[] {
  const tableColumns = Array.from(table.cols.values());

  // Determine target columns (explicit or all)
  const targetColumns = columns && columns.length > 0
    ? columns.map(name => table.requireColumn(name))
    : tableColumns;

  // Check duplicates
  const seen = new Set<Column>();
  for (const col of targetColumns) {
    if (seen.has(col)) {
      throw new Error(`Duplicate column '${col.name}' in INSERT`);
    }
    seen.add(col);
  }

  // Build rows
  return values.map(row => {
    if (row.length !== targetColumns.length) {
      throw new Error("Mismatching number of columns and values");
    }

    // Map input values to target columns
    const explicit = new Map<Column, InsertValue>();
    for (let i = 0; i < targetColumns.length; i++) {
      explicit.set(targetColumns[i], row[i]);
    }

    // Emit InsertCell array in **table column order**, filling omitted with default
    return tableColumns.map(col => ({
      column: col,
      input: explicit.get(col) ?? { kind: "default" }
    }));
  });
}