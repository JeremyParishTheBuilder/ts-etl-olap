import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type SemanticValue } from "../semantic/values.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";

export class InsertRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private inputs: Map<string, ExplicitInput>,
    //private semanticRow: SemanticValue[],
  ) {}

  apply(databases: Databases) {
    const database = databases.require(this.dbName);

    const resolvedRow = database
      .requireTable(this.tableName)
      .resolveInsertInputs(this.inputs);

    const updatedDatabase = databases.require(this.dbName)
      .addRow(this.tableName, resolvedRow);

    return databases.update(updatedDatabase);
  }
}