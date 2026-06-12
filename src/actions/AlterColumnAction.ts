import { type Action } from "./Action.js";
import { type ColumnType } from "../schema/Column.js";
import { type Databases } from "../schema/Databases.js";

export class AlterColumnAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private columnName: string,
    private newType: ColumnType,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.require(this.dbName);
    const table = db.tables.requireByName(this.tableName);
    //const columnId = table.requireColumnIdByName(this.columnName);

    //TODO: altering a column needs to check FKs, so should go to Database, not Table.
    const updatedTable = table
      .alterColumn(this.columnName, this.newType);

    const updatedDatabase = db
    //  .alterColumn(this.tableName, this.columnName, this.newType);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}