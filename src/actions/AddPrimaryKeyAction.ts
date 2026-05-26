import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type PrimaryKeySpec } from "../schema/Constraint.js";

export class AddPrimaryKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: PrimaryKeySpec,
  ) {}

  apply(databases: Databases): Databases {
    //const pk = PrimaryKey.fromSpec(this.spec);

    const db = databases.require(this.dbName);

    const { kind, ...spec } = this.spec;

    const updatedTable = db.requireTable(this.tableName)
      .createPrimaryKey(spec);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}