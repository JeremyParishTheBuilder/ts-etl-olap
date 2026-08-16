import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import type { TablePolicy } from "../relational/Table.js";

export class CreateTableAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private tablePolicy: TablePolicy,
  ) {}

  apply(databases: Databases): Databases {
    const updatedDb = databases
      .requireByName(this.dbName)
      .createTable({ name: this.tableName }, this.tablePolicy);

    return databases.update(updatedDb);
  }
}
