import { type BaseStatement, type StatementBuilder } from "../Statement.js";
import { type PredicateNode } from "../../ast/predicate/PredicateNode.js";

export interface DeleteFromStatement extends BaseStatement {
  kind: "delete_from";
  table: string;
  where?: PredicateNode;
  returning?: string[];
}

export class DeleteFromBuilder implements StatementBuilder {
  private whereClause?: PredicateNode;
  private returningCols?: string[];

  constructor(private table: string) {}

  where(predicate: PredicateNode) {
    this.whereClause = predicate;
  }

  returning(cols: string[]) {
    this.returningCols = cols;
  }

  getNextCalls() {
    if (!this.whereClause)
      return {
        required: [],
        optional: ["where", "returning"],
      };

    return {
      required: [],
      optional: ["returning"],
    };
  }

  createStatement(): DeleteFromStatement {
    return {
      kind: "delete_from",
      table: this.table,
      where: this.whereClause,
      returning: this.returningCols,
    };
  }
}
