import { type Action } from "./Action.js";
import { type SemanticValue } from "../semantic/values.js";
import { type Databases } from "../schema/Databases.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { type ColumnId } from "../schema/Column.js";

export class UpdateRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private rowNum: number,
    private inputs: Map<ColumnId, ExplicitInput>,
    //private semanticRow: SemanticValue[],
  ) {}

  apply(databases: Databases) {
    const database = databases.require(this.dbName);

    const resolvedRow = database
      .requireTable(this.tableName)
      .resolveUpdateInputs(this.inputs, this.rowNum);

    const updatedDatabase = database
      .updateRow(this.tableName, this.rowNum, resolvedRow/*this.updates*/); // TODO, replace this.updates with a resolvedRow? 

    return databases.update(updatedDatabase);
  }
}