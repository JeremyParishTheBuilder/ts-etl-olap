import { type Action } from "./Action.js";
import { type ColumnType } from "../types/ColumnType.js";
import { type Databases } from "../relational/Databases.js";

export class AlterColumnAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private columnName: string,
    private newType: ColumnType,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const updatedDatabase = db
      .alterColumn(this.tableName, this.columnName, this.newType);

    return databases.update(
      updatedDatabase
    );
  }
}