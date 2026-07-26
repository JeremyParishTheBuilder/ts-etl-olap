import { type Action } from "./Action.js";
import { type IndexSpec } from "../relational/Index.js";
import { type Databases } from "../relational/Databases.js";

export class AddIndexAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: IndexSpec & {
      internal?: boolean
    },
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db
      .tables.requireByName(this.tableName)
      .createIndex(this.spec);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}
