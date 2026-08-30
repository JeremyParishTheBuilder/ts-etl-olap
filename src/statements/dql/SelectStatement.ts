import { type PredicateNode } from "../../ast/predicate/PredicateNode.js";
import type { SelectInput } from "../../types/SelectInput.js";
import { type BaseStatement, type StatementBuilder } from "../Statement.js";

export interface SelectStatement extends BaseStatement {
  kind: "select";
  tableName: string;
  expressions: SelectInput[] | "*";
  where?: PredicateNode;
}

export class SelectBuilder implements StatementBuilder {
  private tableName?: string;
  private whereClause?: PredicateNode;

  constructor(private expressions: SelectInput[] | "*") {}

  from(tableName: string) {
    this.tableName = tableName;
  }

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
  }

  getNextCalls() {
    if (!this.tableName)
      return {
        required: ["from"],
        optional: [],
      };
    if (!this.whereClause)
      return {
        required: [],
        optional: ["where"],
      };

    return {
      required: [],
      optional: [],
    };
  }

  createStatement(): SelectStatement {
    if (!this.tableName) {
      throw new Error("Missing required call: from()");
    }

    return {
      kind: "select",
      tableName: this.tableName,
      expressions: this.expressions,
      where: this.whereClause,
    };
  }
}
