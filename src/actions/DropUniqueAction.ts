import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type UniqueId } from "../schema/Unique.js";

export class DropUniqueAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private uniqueId: UniqueId,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db
      .tables.requireByName(this.tableName)
      .removeUniqueById(this.uniqueId);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}