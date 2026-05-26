import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { Check } from "../schema/Check.js";
import { type CheckSpec } from "../schema/Constraint.js";

export class AddCheckAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: CheckSpec,
  ) {}

  apply(databases: Databases): Databases {
    const check = Check.fromSpec(this.spec);

    const db = databases.require(this.dbName);

    //const { kind, ...spec } = this.spec;

    const updatedTable = db.requireTable(this.tableName)
      .addCheck(check);

      const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}