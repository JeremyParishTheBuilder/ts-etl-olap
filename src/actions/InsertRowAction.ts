import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";

export class InsertRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private inputs: Map<string, ExplicitInput>,
  ) {}

  apply(databases: Databases) {
    const database = databases.require(this.dbName);

    const resolvedRow = database
      .tables.requireByName(this.tableName)
      .resolveInsertInputs(this.inputs);

    const updatedDatabase = database
      .addRow(this.tableName, resolvedRow);

    return databases.update(updatedDatabase);
  }
}