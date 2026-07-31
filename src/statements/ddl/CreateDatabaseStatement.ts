import { type BaseStatement, type StatementBuilder } from "../Statement.js";

export interface CreateDatabaseStatement extends BaseStatement {
  kind: "create_database";
  dbName: string;
}

export class CreateDatabaseBuilder implements StatementBuilder {
  constructor(private dbName: string) {}

  getNextCalls() {
    return {
      required: [],
      optional: [],
    };
  }

  createStatement(): CreateDatabaseStatement {
    return {
      kind: "create_database",
      dbName: this.dbName,
    };
  }
}
