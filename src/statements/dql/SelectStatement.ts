import { type PredicateNode } from "../../ast/predicate/PredicateNode.js";
import type { SelectInput } from "../../types/SelectInput.js";
import { type BaseStatement } from "../Statement.js";
import type { QueryStatement } from "./QueryStatement.js";
import { QueryStatementBuilder } from "./QueryStatementBuilder.js";
import { UnionAllBuilder } from "./UnionAllStatement.js";

export interface SelectStatement extends BaseStatement {
  kind: "select";
  tableName: string;
  expressions: SelectInput[] | "*";
  where?: PredicateNode;
}

export class SelectBuilder implements QueryStatementBuilder {
  private tableName?: string;
  private whereClause?: PredicateNode;

  constructor(private expressions: SelectInput[] | "*") {
    //super();
  }

  from(tableName: string) {
    this.tableName = tableName;
  }

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
  }

  unionAll(query: QueryStatement) {
    return new UnionAllBuilder(
      this.createStatement(),
      query,
    );
  }

  getNextCalls() {
    const required: string[] = [];
    const optional: string[] = [];

    if (!this.tableName) {
      return {
        required: ["from"],
        optional,
      };
    }

    if (!this.whereClause) {
      optional.push("where");
    }

    optional.push("unionAll");

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
