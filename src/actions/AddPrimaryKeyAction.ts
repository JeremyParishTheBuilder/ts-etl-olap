import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type PrimaryKeySpec } from "../schema/Constraint.js";

export class AddPrimaryKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: Omit<PrimaryKeySpec, "kind">,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);
    //const table = db.tables.requireByName(this.tableName);

    //const columnIds = this.spec.columns.map(c => table.columns.requireIdByName(c));
    //const index = table.requireUniqueIndexByColumns(columnIds);

    const updatedTable = db.tables.requireByName(this.tableName)
      .createPrimaryKey({
        ...this.spec
      });

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}