import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type ColumnInput } from "../types/ColumnInput.js";
import { type ColumnId } from "../relational/Column.js";

export class InsertRowsAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private inputRows: Map<ColumnId, ColumnInput>[],
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    db.tables.requireByName(this.tableName);

    const updatedDatabase = db.addRows(this.tableName, this.inputRows);

    return databases.update(updatedDatabase);
  }
}
