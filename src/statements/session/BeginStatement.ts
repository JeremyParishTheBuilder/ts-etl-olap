import { type BaseStatement, type StatementBuilder } from "../Statement.js";

export interface BeginStatement extends BaseStatement {
  kind: "begin";
}

export class BeginBuilder implements StatementBuilder {
  constructor() {}

  getNextCalls() {
    return {
      required: [],
      optional: [],
    };
  }

  createStatement(): BeginStatement {
    return { kind: "begin" };
  }
}
