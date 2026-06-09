import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";

export class CreateTableAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
  ) {}

  apply(databases: Databases): Databases {
    const updatedDb = databases.require(this.dbName)
      .createTable({name: this.tableName});

    return databases.update(updatedDb);
  }
}