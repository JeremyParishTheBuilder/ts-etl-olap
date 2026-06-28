import { ColumnSchema } from "./ColumnSchema.js";

export class TableSchema {
  constructor(
    readonly name: string,
    readonly columns = new Map<string, ColumnSchema>()
  ) {}

  observe(
    columnName: string,
    value: unknown
  ): void {
    let column =
      this.columns.get(columnName);

    if (!column) {
      column = new ColumnSchema(columnName);
      this.columns.set(columnName, column);
    }

    column.observe(value);
  }
}