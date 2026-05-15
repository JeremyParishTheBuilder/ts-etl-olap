import { type Action } from "./Action.js";
import { 
  Index,
  type IndexSpec,
} from "../schema/Index.js";
import { type Databases } from "../schema/Databases.js";

export class AddIndexAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: IndexSpec,
  ) {}

  apply(databases: Databases): Databases {
    const index = Index.fromSpec(this.spec);

    const db = databases.require(this.dbName);

    const updatedTable = db.requireTable(this.tableName)
      .addIndex(index);

    return databases.update(
      db.updateTable(updatedTable)
    );
  }
}