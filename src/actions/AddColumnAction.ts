import { type Action } from "./Action.js";
import { type ColumnSpec } from "../schema/Column.js";
import { type Databases } from "../schema/Databases.js";

export class AddColumnAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private columnSpec: ColumnSpec,
  ) {}

  apply(databases: Databases) {
    const db = databases.require(this.dbName);

    const updatedTable = db.tables.requireByName(this.tableName)
      .createColumn(this.columnSpec);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}