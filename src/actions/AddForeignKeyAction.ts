import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ForeignKeySpec } from "../schema/Constraint.js";
import { type ReferentialAction } from "../schema/ReferentialAction.js";

export class AddForeignKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: Omit<ForeignKeySpec, "kind"> & {
      onDelete: ReferentialAction,
      onUpdate: ReferentialAction,
      reverseIndex: string,
    },
  ) {}

  apply(databases: Databases): Databases {
    const updatedDatabase = databases
      .requireByName(this.dbName)
      .createForeignKey(
        this.tableName,
        this.spec,
      );

    return databases.update(updatedDatabase);
  }
}