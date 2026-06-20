import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";

export class DropPrimaryKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db
      .tables.requireByName(this.tableName)
      .removePrimaryKey();

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}