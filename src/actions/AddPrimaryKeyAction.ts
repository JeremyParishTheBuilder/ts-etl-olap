import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { PrimaryKey } from "../schema/PrimaryKey.js";
import { CONSTRAINT_KIND, type PrimaryKeySpec } from "../schema/Constraint.js";

export class AddPrimaryKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: PrimaryKeySpec,
  ) {}

  apply(databases: Databases): Databases {
    const pk = PrimaryKey.fromSpec(this.spec);

    const db = databases.require(this.dbName);

    const updatedTable = db.requireTable(this.tableName)
      .addPrimaryKey(pk);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}