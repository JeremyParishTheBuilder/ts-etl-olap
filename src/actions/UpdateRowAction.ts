import { type Action } from "./Action.js";
import { type ColumnValue } from "../schema/Column.js";
import { type Databases } from "../schema/Databases.js";

export class UpdateRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private rowNum: number,
    private updates: Map<number, ColumnValue>,
  ) {}

  apply(databases: Databases) {
    const updatedDatabase = databases.require(this.dbName)
      .updateRow(this.tableName, this.rowNum, this.updates);

    return databases.update(updatedDatabase);
  }
}