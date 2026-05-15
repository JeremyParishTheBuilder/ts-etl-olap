import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";

export class CreateTableAction implements Action {
  constructor(
    private dbName: string,
    private name: string,
  ) {}

  apply(databases: Databases): Databases {
    const updatedDb = databases.require(this.dbName)
      .createTable(this.name);

    return databases.update(updatedDb);
  }
}