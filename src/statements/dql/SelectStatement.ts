import { type PredicateNode } from "../../ast/predicate/PredicateNode.js";
import type { SelectInput } from "../../types/SelectInput.js";
import { type BaseStatement } from "../Statement.js";
import { QueryStatementBuilder } from "./QueryStatementBuilder.js";

export interface SelectStatement extends BaseStatement {
  kind: "select";
  tableName: string;
  expressions: SelectInput[] | "*";
  where?: PredicateNode;
}

export class SelectBuilder extends QueryStatementBuilder {
  private tableName?: string;
  private whereClause?: PredicateNode;

  constructor(private expressions: SelectInput[] | "*") {
    super();
  }

  from(tableName: string) {
    this.tableName = tableName;
  }

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
  }

  getNextCalls() {
    if (!this.tableName) {
      return {
        required: ["from"],
        optional: [],
      };
    }

    const { required, optional } = super.getNextCalls();

    if (!this.whereClause) {
      optional.push("where");
    }

    return {
      required,
      optional,
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
