import { TableSchema } from "./TableSchema.js";

export class DatabaseSchema {
  constructor(
    readonly tables = new Map<string, TableSchema>()
  ) {}

  getOrCreateTable(
    name: string
  ): TableSchema {
    let table = this.tables.get(name);

    if (!table) {
      table = new TableSchema(name);
      this.tables.set(name, table);
    }

    return table;
  }
}