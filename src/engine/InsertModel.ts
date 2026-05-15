import type { ColumnValue, Column } from "../schema/Column.js";
import type { Table } from "../schema/Table.js";

export type InsertValue =
  | { kind: "value"; value: ColumnValue }
  | { kind: "default" }
  | { kind: "null" }
  | { kind: "generated" }
  | { kind: "expression"; expr: any/*Expression*/ };

export type InsertRow = InsertValue[];

//This does normalization of input into a format acceptable to the Table
//the input row of values will include a cell for all columns, and in the correct order.
export function bindInsertRows(
  table: Table,
  columns: string[] | null,
  values: InsertValue[][]
): InsertRow[] {
  const tableColumns = Array.from(table.columns.map.values());

  // Determine target columns (explicit or all)
  const targetColumns = columns && columns.length > 0
    ? columns.map(name => table.requireColumn(name))
    : tableColumns;

  // Check for duplicates
  const seen = new Set<Column>();
  for (const col of targetColumns) {
    if (seen.has(col)) {
      throw new Error(`Duplicate column '${col.name}' in INSERT`);
    }
    seen.add(col);
  }

  // Map columns to explicitly input values
  const targetColumnIndexMap = new Map<Column, number>();
  targetColumns.forEach((col, i) => targetColumnIndexMap.set(col, i));

  // Build rows
  return values.map(row => {
    return tableColumns.map(col => {
      const idx = targetColumnIndexMap.get(col);
      return idx !== undefined ? row[idx] : { kind: "default" };
    });
  });
}