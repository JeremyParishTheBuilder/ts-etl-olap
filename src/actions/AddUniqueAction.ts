import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";

export class AddUniqueAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: {
      name: string,
      indexName: string,
      ownsIndex: boolean,
    },
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db
      .tables.requireByName(this.tableName)
      .createUnique(this.spec);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}
