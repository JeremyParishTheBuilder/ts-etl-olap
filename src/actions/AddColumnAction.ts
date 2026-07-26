import { type Action } from "./Action.js";
import { type ColumnSpec } from "../relational/Column.js";
import { type Databases } from "../relational/Databases.js";

export class AddColumnAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private columnSpec: ColumnSpec,
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db.tables.requireByName(this.tableName)
      .createColumn(this.columnSpec);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}