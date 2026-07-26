import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";

export class CreateTableAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
  ) {}

  apply(databases: Databases): Databases {
    const updatedDb = databases.requireByName(this.dbName)
      .createTable({name: this.tableName});

    return databases.update(updatedDb);
  }
}