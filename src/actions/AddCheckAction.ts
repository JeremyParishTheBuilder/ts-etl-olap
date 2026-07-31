import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type CheckSpec } from "../relational/Constraint.js";

export class AddCheckAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: Omit<CheckSpec, "kind">,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedTable = db.tables
      .requireByName(this.tableName)
      .createCheck(this.spec);

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}
