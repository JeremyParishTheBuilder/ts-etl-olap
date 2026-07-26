import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";

export class DropCheckAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private checkName: string,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db
      .tables.requireByName(this.tableName)
      .removeCheck(this.checkName);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}