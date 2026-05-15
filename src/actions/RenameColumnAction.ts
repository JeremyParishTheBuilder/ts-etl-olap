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
    const updatedDb = databases.require(this.dbName)
      .renameColumn(this.tableName, this.oldColumnName, this.newColumnName);
    
    return databases.update(updatedDb);
  }
}