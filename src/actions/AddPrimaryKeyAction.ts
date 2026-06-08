import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type PrimaryKeySpec } from "../schema/Constraint.js";

export class AddPrimaryKeyAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: Omit<PrimaryKeySpec, "kind">,
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.require(this.dbName);
    const table = db.requireTable(this.tableName);

    const columnIds = this.spec.columns.map(c => table.requireColumnIdByName(c));
    const index = table.requireUniqueIndexByColumns(columnIds);

    // const index = this.spec.index ?
    //   table.requireIndex(this.spec.index) :
    //   table.requireUniqueIndexByColumns(
    //     this.spec.columns.map(c => table.requireColumnIdByName(c))
    //   );
    //const columns = this.spec.columns.map(c => table.requireColumnIdByName(c));
    // TODO, make semantic analyzer dertime whether to use this?
    // should foreignKey spec even still accept a column array?

    //const index = table.requireUniqueIndexByColumns(columns);


    const updatedTable = table
      .createPrimaryKeyById({
        ...this.spec,
        index: index.id
      });

    const updatedDb = db.updateTable(updatedTable);

    return databases.update(updatedDb);
  }
}