import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ExplicitInput } from "../types/ExplicitInput.js";
import { type ColumnId } from "../schema/Column.js";

export class InsertRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private inputs: Map<ColumnId, ExplicitInput>,
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const table = db.tables.requireByName(this.tableName);

    const resolvedRow = table
      .resolveInsertInputs(this.inputs);

    const updatedDatabase = db
      .addRow(this.tableName, resolvedRow);

    return databases.update(updatedDatabase);
  }
}