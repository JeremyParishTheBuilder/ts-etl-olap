import { type Action } from "./Action.js";
import { type IndexSpec } from "../schema/Index.js";
import { type Databases } from "../schema/Databases.js";

export class AddIndexAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: IndexSpec,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.require(this.dbName);

    const updatedTable = db.requireTable(this.tableName)
      .createIndex(this.spec);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}