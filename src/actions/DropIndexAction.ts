import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type IndexId } from "../schema/Index.js";

export class DropIndexAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    //private indexName: string,
    private indexId: IndexId,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.require(this.dbName);

    const updatedTable = db
      .requireTable(this.tableName)
      //.removeIndex(this.indexName);
      .removeIndexById(this.indexId);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}