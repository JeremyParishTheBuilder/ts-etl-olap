import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type ForeignKeyId } from "../relational/ForeignKey.js";

export class DropForeignKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private foreignKeyId: ForeignKeyId,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db
      .tables.requireByName(this.tableName)
      .removeForeignKeyById(this.foreignKeyId);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}