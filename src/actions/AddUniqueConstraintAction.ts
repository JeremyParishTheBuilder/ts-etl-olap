import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";

export class AddUniqueConstraintAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private spec: {
      name: string;
      columns?: string[];
      using?: string;
      nullsDistinct: boolean;
    },
  ) {}

  apply(databases: Databases): Databases {
    const db = databases.requireByName(this.dbName);

    const table = db.tables.requireByName(this.tableName);

    const updatedTable = table.createUniqueConstraint(this.spec);

    // const existingIndex: boolean = this.spec.using ? true : false;

    // //one option: possibly put some logic here in the Action
    // let index;
    // if (!existingIndex) {
    //   if (!this.spec.columns) {
    //     throw new Error(`Missing columns.`);
    //   }

    //   table = table
    //     .createIndex({
    //       name: this.spec.name,
    //       columns: this.spec.columns,
    //       unique: true,
    //     })

    //   index = table.indexes.requireByName(this.spec.name);
    // } else {
    //   index = table.indexes.requireByName(this.spec.using!);
    // }

    // //alternatively, move logic into Table, and keep the Action look like a simple orchestrator
    // table = table
    //   .assertOrCreateUniqueIndex(this.spec);

    // table = table
    //   .createUnique({
    //     name: this.spec.name,
    //     indexName: index.name,
    //     ownsIndex: existingIndex ? false : true,
    //   });

    return databases.update(db.updateTable(updatedTable));
  }
}
