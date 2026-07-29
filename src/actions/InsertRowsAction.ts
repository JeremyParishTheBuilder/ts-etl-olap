import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { type ColumnId } from "../relational/Column.js";
import type { ResolvedInsert } from "../types/ResolvedInsert.js";

export class InsertRowsAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private inputRows: Map<ColumnId, ExplicitInput>[],
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const table = db.tables.requireByName(this.tableName);

    const resolvedInserts: ResolvedInsert[] =
      this.inputRows.map(input => ({
          newRow: table.resolveInsertInputs(input),
      }));

    const updatedDatabase = db
      .addRows(
        this.tableName,
        resolvedInserts
      );

    return databases.update(updatedDatabase);
  }
}