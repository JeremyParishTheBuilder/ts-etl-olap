import { type ImportResult } from "./ImportResult.js";

export class SchemaBuilder {
  readonly schema = new DatabaseSchema();

  observe(
    result: ImportResult
  ): void {
    const table = this.schema.getOrCreateTable(result.tableName);

    for (const [column, value] of result.values) {
      table.observe(column, value);
    }
  }
}

export class DatabaseSchema {
  constructor(
      readonly tables = new Map<string, TableSchema>()
  ) {}

  getOrCreateTable(
      name: string
  ): TableSchema {
    let table =
        this.tables.get(name);

    if (!table) {
        table = new TableSchema(name);
        this.tables.set(name, table);
    }

    return table;
  }
}

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

export class ColumnSchema {
  constructor(
    readonly name: string,
    readonly observedTypes = new Set<string>(),
    public nullable = false
  ) {}

  observe(
    value: unknown
  ): void {
    if (value == null) {
      this.nullable = true;
      return;
    }

    this.observedTypes.add(
      typeof value
    );
  }
}