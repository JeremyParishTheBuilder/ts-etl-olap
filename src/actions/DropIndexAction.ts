import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type IndexId } from "../relational/Index.js";

export class DropIndexAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private indexId: IndexId,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db.tables
      .requireByName(this.tableName)
      .removeIndexById(this.indexId);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}
