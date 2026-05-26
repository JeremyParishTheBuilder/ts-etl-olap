import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ForeignKeySpec } from "../schema/Constraint.js";
import { ReferentialAction } from "../schema/ReferentialAction.js";

export class AddForeignKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: ForeignKeySpec & {
      onDelete: ReferentialAction,
      onUpdate: ReferentialAction,
    },
  ) {}

  apply(databases: Databases): Databases {
    const { kind, ...spec } = this.spec;

    const updatedDatabase = databases.require(this.dbName)
      .createForeignKey(this.tableName, spec);

    return databases.update(updatedDatabase);
  }
}