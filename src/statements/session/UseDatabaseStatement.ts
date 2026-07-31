import { type BaseStatement, type StatementBuilder } from "../Statement.js";

export interface UseDatabaseStatement extends BaseStatement {
  kind: "use_database";
  dbName: string;
}

export class UseDatabaseBuilder implements StatementBuilder {
  constructor(private dbName: string) {}

  getNextCalls() {
    return {
      required: [],
      optional: [],
    };
  }

  createStatement(): UseDatabaseStatement {
    return {
      kind: "use_database",
      dbName: this.dbName,
    };
  }
}
