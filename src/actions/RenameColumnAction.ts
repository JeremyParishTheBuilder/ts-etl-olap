import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";

export class RenameColumnAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private oldColumnName: string,
    private newColumnName: string,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.require(this.dbName);
    
    const updatedTable = db
      .requireTable(this.tableName)
      .renameColumn(this.oldColumnName, this.newColumnName);

    const updatedDb = db.updateTable(updatedTable);
    
    return databases.update(updatedDb);
  }
}