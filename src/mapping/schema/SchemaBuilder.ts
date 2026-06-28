import { type ImportResult } from "../ImportResult.js";
import { DatabaseSchema } from "./DatabaseSchema.js";

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