import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { type ColumnId } from "../schema/Column.js";

export class UpdateRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private rowNum: number,
    private inputs: Map<ColumnId, ExplicitInput>,
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const resolvedRow = db
      .tables.requireByName(this.tableName)
      .resolveUpdateInputs(this.inputs, this.rowNum);

    const updatedDatabase = db
      .updateRow(this.tableName, this.rowNum, resolvedRow);

    return databases.update(updatedDatabase);
  }
}