import { type Action } from "./Action.js";
import { type ColumnValue } from "../schema/Column.js";
import { type Databases } from "../schema/Databases.js";

export class UpdateRowAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private updates: Map<number, ColumnValue>,
    private rowNum: number,
  ) {}

  apply(databases: Databases) {
    const updatedDatabase = databases.require(this.dbName)
      .updateRow(this.tableName, this.updates, this.rowNum);

    return databases.update(updatedDatabase);
  }
}