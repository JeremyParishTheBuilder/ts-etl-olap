import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { ForeignKey } from "../schema/ForeignKey.js";
import { type ForeignKeySpec } from "../schema/Constraint.js";

export class AddForeignKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: ForeignKeySpec,
  ) {}

  apply(databases: Databases): Databases {
    const fk = ForeignKey.fromSpec(this.spec);

    const updatedDatabase = databases.require(this.dbName)
      .addForeignKey(this.tableName, fk);

    return databases.update(updatedDatabase);
  }
}