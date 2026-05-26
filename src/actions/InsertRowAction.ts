import { type Action } from "./Action.js";
import { type ColumnValue } from "../schema/Column.js";
import { type Databases } from "../schema/Databases.js";

export class InsertRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private resolvedRow: ColumnValue[],
  ) {}

  apply(databases: Databases) {
    const updatedDatabase = databases.require(this.dbName)
      .addRow(this.tableName, this.resolvedRow);

    return databases.update(updatedDatabase);
  }
}