import { type PredicateNode } from "../../ast/predicate/PredicateNode.js";
import type { SelectInput } from "../../types/SelectInput.js";
import { type BaseStatement } from "../Statement.js";
import { QueryStatementBuilder } from "./QueryStatementBuilder.js";
import type { RelationSource } from "../../semantic/relation/RelationSource.js";

export interface SelectStatement extends BaseStatement {
  kind: "select";
  source: RelationSource;
  projection: SelectInput[] | "*";
  where?: PredicateNode;
}

export class SelectBuilder extends QueryStatementBuilder {
  protected whereClause?: PredicateNode;

  constructor(protected projection: SelectInput[] | "*") {
    super();
  }

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
  }

  getNextCalls() {
    if (!this.source) {
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
    if (!this.source) {
      throw new Error("Missing required call: from()");
    }

    return {
      kind: "select",
      source: this.source,
      projection: this.projection,
      where: this.whereClause,
    };
  }
}
