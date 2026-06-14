import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";

export class DropColumnAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private columnName: string,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    //TODO: drop column needs to check FKs, so should go to Database, not Table.
    const updatedTable = db.tables.requireByName(this.tableName)
      .removeColumn(this.columnName);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}