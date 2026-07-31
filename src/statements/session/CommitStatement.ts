import { type BaseStatement, type StatementBuilder } from "../Statement.js";

export interface CommitStatement extends BaseStatement {
  kind: "commit";
}

export class CommitBuilder implements StatementBuilder {
  constructor() {}

  getNextCalls() {
    return {
      required: [],
      optional: [],
    };
  }

  createStatement(): CommitStatement {
    return { kind: "commit" };
  }
}
